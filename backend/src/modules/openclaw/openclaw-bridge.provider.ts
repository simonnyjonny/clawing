import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface OpenClawMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenClawRequest {
  messages: OpenClawMessage[];
  stream?: boolean;
}

export interface OpenClawResponse {
  success: boolean;
  message?: string;
  content?: string;
  error?: string;
  isMock?: boolean;
}

@Injectable()
export class OpenClawBridgeProvider {
  private readonly logger = new Logger(OpenClawBridgeProvider.name);
  private readonly DEFAULT_TIMEOUT_MS = 10000;
  private readonly MAX_CONTEXT_MESSAGES = 10;

  constructor(private prisma: PrismaService) {}

  async sendMessage(
    aiProfileId: string,
    userMessage: string,
    roomId: string,
  ): Promise<OpenClawResponse> {
    const binding = await this.prisma.openClawBinding.findUnique({
      where: { aiProfileId },
      include: {
        aiProfile: true,
        qualification: true,
      },
    });

    if (!binding) {
      return { success: false, error: 'AI未绑定OpenClaw' };
    }

    if (binding.status !== 'approved') {
      return { success: false, error: '绑定未审核通过' };
    }

    if (!binding.qualification?.isAllowed) {
      return { success: false, error: 'AI未获得开播资格' };
    }

    if (!binding.openclawEndpoint) {
      this.logger.warn(`OpenClaw endpoint not configured for AI ${aiProfileId}, using mock fallback`);
      return this.getMockResponse(binding.aiProfile.name, userMessage);
    }

    try {
      const context = await this.getContext(roomId);
      const request: OpenClawRequest = {
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(binding.aiProfile.persona, binding.aiProfile.style),
          },
          ...context,
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: false,
      };

      const response = await this.callOpenClaw(
        binding.openclawEndpoint,
        binding.authType,
        binding.authTokenHash,
        request,
      );

      if (response.success && response.content) {
        return this.filterResponse(response.content);
      }

      return response;
    } catch (error) {
      this.logger.error(`OpenClaw API error: ${error.message}`);
      return this.getMockResponse(binding.aiProfile.name, userMessage);
    }
  }

  private async getContext(roomId: string): Promise<OpenClawMessage[]> {
    const recentMessages = await this.prisma.message.findMany({
      where: {
        roomId,
        type: { in: ['text', 'ai_reply'] },
      },
      orderBy: { createdAt: 'desc' },
      take: this.MAX_CONTEXT_MESSAGES,
    });

    return recentMessages.reverse().map((msg) => ({
      role: msg.type === 'ai_reply' ? 'assistant' : 'user',
      content: msg.content,
    }));
  }

  private buildSystemPrompt(persona: string, style?: string | null): string {
    let prompt = persona;
    if (style) {
      prompt += ` 回复风格: ${style}`;
    }
    return prompt;
  }

  private async callOpenClaw(
    endpoint: string,
    authType: string,
    _authTokenHash: string | null,
    request: OpenClawRequest,
  ): Promise<OpenClawResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authType === 'token' || authType === 'apiKey') {
        headers['Authorization'] = `Bearer mock-token`;
      }

      const response = await fetch(`${endpoint}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `OpenClaw API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        content: data.message?.content || data.content || data.response,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return { success: false, error: 'OpenClaw API timeout' };
      }
      throw error;
    }
  }

  private filterResponse(content: string): OpenClawResponse {
    const filtered = content.trim();
    if (!filtered) {
      return { success: false, error: 'Empty response from OpenClaw' };
    }
    return { success: true, content: filtered };
  }

  private async getMockResponse(aiName: string, userMessage: string): Promise<OpenClawResponse> {
    const mockReplies = [
      `你好呀！${aiName}在这里~ 很高兴见到你！`,
      '谢谢你的发言！有什么想聊的吗？',
      `${aiName}正在认真听你说话呢~`,
      '今天过得怎么样？有什么有趣的事情吗？',
      '我很高兴你能来我的直播间！我们来聊天吧~',
      `${aiName}: ${userMessage} 这个话题真有意思！`,
      '有什么问题想问的吗？我可以帮你解答~',
      '哇，这是一个很棒的问题！让我想想...',
    ];

    const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
    return {
      success: true,
      content: reply,
      isMock: true,
    };
  }

  async isConfigured(aiProfileId: string): Promise<boolean> {
    const binding = await this.prisma.openClawBinding.findUnique({
      where: { aiProfileId },
    });

    return !!binding?.openclawEndpoint;
  }
}
