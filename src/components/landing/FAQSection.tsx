import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does ClipForge AI extract the best moments from long videos?',
      a: 'The clipping engine evaluates audio transcripts for high-retention speech patterns—such as compelling opening questions, counter-intuitive statements, tactical takeaways, and emotional voice inflection. It pinpoints self-contained ideas that work without requiring full episode context.',
    },
    {
      q: 'What video file formats and lengths are supported?',
      a: 'We support MP4, MOV, WebM, and standard video containers up to 1.5 GB in the browser. Videos from 2 minutes up to several hours can be processed and split into ready-to-publish short clips.',
    },
    {
      q: 'Can I edit the generated clips and timestamps myself?',
      a: 'Yes! The dedicated Clip Editor workspace provides a dual-handle interactive timeline where you can nudge cut boundaries down to 0.2-second precision, rewrite caption lines, change highlight keyword colors, and switch aspect ratios.',
    },
    {
      q: 'Do I get subtitle files to use in Premiere Pro or DaVinci Resolve?',
      a: 'Absolutely. Every clip allows 1-click export of SubRip (.SRT) and WebVTT (.VTT) caption files, fully synchronized to the video timestamps, ready to drop into external video editors.',
    },
    {
      q: 'How is user privacy and video data handled?',
      a: 'In this frontend application, all video metadata parsing and simulated clipping operate entirely on your machine. No source videos are uploaded to public cloud buckets without your explicit confirmation.',
    },
  ];

  return (
    <section id="faq" className="py-20 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Everything you need to know about the AI video clipping workflow.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-xl border overflow-hidden transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base hover:text-brand-500 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-500' : 'text-[var(--text-muted)]'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div
                    className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
