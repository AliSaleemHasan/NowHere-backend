import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'net';

const SMTP_TIMEOUT_MS = 8_000;

@Injectable()
export class SmtpMailer {
  private readonly logger = new Logger(SmtpMailer.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        this.logger.warn('SMTP_HOST unset; password reset email not sent');
      } else {
        this.logger.log(
          `SMTP_HOST unset; password reset for ${to}: ${resetUrl}`,
        );
      }
      return false;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') || 1025);
    const from = this.config.get<string>('SMTP_FROM') || 'nowhere@localhost';
    const subject = 'Reset your NowHere password';
    const text = `Reset your password: ${resetUrl}`;

    await sendSmtpMail({
      host,
      port: Number.isFinite(port) ? port : 1025,
      from,
      to,
      subject,
      text,
    });
    return true;
  }
}

function sendSmtpMail(options: {
  host: string;
  port: number;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { host, port, from, to, subject, text } = options;
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let buffer = '';
    let settled = false;
    const queue: string[] = [
      `EHLO nowhere.local`,
      `MAIL FROM:<${from}>`,
      `RCPT TO:<${to}>`,
      `DATA`,
    ];
    const escapedText = text.replace(/^\./gm, '..');
    const body = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      escapedText,
    ].join('\r\n');

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.once('timeout', () => finish(new Error('SMTP timeout')));
    socket.once('error', (err) => finish(err));
    socket.once('end', () => finish(new Error('SMTP connection closed')));

    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const code = Number(line.slice(0, 3));
        if (!Number.isFinite(code) || line.length < 3) continue;
        if (line[3] === '-') continue;
        if (code >= 400) {
          finish(new Error(`SMTP error: ${line}`));
          return;
        }
        if (queue.length > 0) {
          socket.write(`${queue.shift()}\r\n`);
          continue;
        }
        if (code === 354) {
          socket.write(`${body}\r\n.\r\n`);
          continue;
        }
        socket.write('QUIT\r\n');
        finish();
        return;
      }
    });

    socket.connect(port, host);
  });
}
