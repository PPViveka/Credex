import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { getAudit, updateAuditLead } from '../../../../lib/db';

// Initialize external SDK clients with graceful fallbacks
const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
const resendKey = process.env.RESEND_API_KEY || '';

const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
const resend = resendKey ? new Resend(resendKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { auditId, email, name, role, company } = await request.json();

    if (!auditId || !email) {
      return NextResponse.json(
        { message: 'Audit ID and email address are required.' },
        { status: 400 }
      );
    }

    // 1. Retrieve the existing audit
    const auditRecord = await getAudit(auditId);
    if (!auditRecord) {
      return NextResponse.json(
        { message: `Audit with ID ${auditId} not found.` },
        { status: 404 }
      );
    }

    const { results, teamSize, useCase } = auditRecord;

    // 2. Generate Personalized Executive Summary (using Anthropic Claude or strict fallback)
    let aiSummary = '';
    const breakdownDescription = results.breakdown
      .map(b => `${b.toolName}: Current ${b.currentPlan} ($${b.currentSpend}/mo) -> Recommended ${b.recommendedPlan} ($${b.recommendedSpend}/mo). Action: ${b.recommendedAction}. Reason: ${b.reason}`)
      .join('\n');

    if (anthropic) {
      console.log('[LLM] Invoking Anthropic Claude API for executive summary...');
      try {
        const prompt = `Write a concise, professional 100-word spend optimization executive summary for a startup founder based on these AI Spend Audit results:
Team size: ${teamSize}
Primary Stack Use Case: ${useCase}
Current Monthly AI Tool Spend: $${results.totalCurrentSpend}
Recommended Monthly Spend: $${results.totalRecommendedSpend}
Potential Monthly Savings: $${results.totalMonthlySavings}

Per-Tool Audit Breakdown:
${breakdownDescription}

Strict Guidelines:
1. Keep it under 100 words. Be incredibly direct and punchy.
2. Adopt the tone of an elite, finance-literate fractional CFO and SaaS optimization expert.
3. Highlight the single largest saving opportunity (e.g. duplicate subscriptions or ghost seats) and double-down on the strategic value of removing that waste.
4. Do NOT include markdown styling other than normal paragraphs. Avoid placeholders or introductory filler text. Output exactly the paragraph.`;

        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 200,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        });

        // Parse content safely
        if (message.content && message.content.length > 0 && message.content[0].type === 'text') {
          aiSummary = message.content[0].text.trim();
        } else {
          throw new Error('Unexpected Claude response format.');
        }
      } catch (err) {
        console.error('[LLM] Anthropic API failed, falling back to local text template:', err);
        aiSummary = getLocalSummaryFallback(results, teamSize, useCase);
      }
    } else {
      console.log('[LLM] Anthropic API Key missing. Generating beautiful deterministic local executive summary...');
      aiSummary = getLocalSummaryFallback(results, teamSize, useCase);
    }

    // 3. Compile Transactional Confirmation Email (HTML)
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const auditUrl = `${protocol}://${host}/audit/${auditId}`;

    const emailHtmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e4e7eb; border-radius: 12px; background-color: #ffffff; color: #0b0f19;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin: 0; color: #0b0f19; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">credex <span style="color: #00f299; font-size: 14px; vertical-align: super; background-color: #0b0f19; padding: 2px 6px; border-radius: 4px; font-weight: bold;">audit</span></h2>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hello ${name || 'there'},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">Your Credex AI Spend Audit has been completed successfully! Our deterministic calculations have identified significant optimizations in your developer tool stack.</p>
        
        <div style="background: linear-gradient(135deg, #0b0f19 0%, #1e293b 100%); padding: 25px; margin: 30px 0; border-radius: 8px; color: #ffffff; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #00f299; font-weight: bold; display: block; margin-bottom: 5px;">Potential Monthly Savings</span>
          <span style="font-size: 32px; font-weight: 800; display: block; margin-bottom: 15px; color: #00f299;">$${results.totalMonthlySavings}/mo</span>
          <span style="font-size: 14px; color: #cbd5e1; display: block;">Equivalent to <strong>$${results.totalAnnualSavings}/yr</strong> immediate cash back</span>
        </div>

        <h3 style="color: #0b0f19; font-size: 18px; font-weight: 700; margin-top: 30px; margin-bottom: 10px;">Advisor Executive Summary:</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; background-color: #f8fafc; border-left: 4px solid #0b0f19; padding: 15px; border-radius: 0 8px 8px 0; font-style: italic;">
          "${aiSummary}"
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #374151; margin-top: 25px;">To see a full itemized breakdown detailing which seats are ghost licenses, where duplicate subscriptions overlap, and how to execute each optimization step, click below to open your report:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${auditUrl}" style="background-color: #00f299; color: #0b0f19; font-weight: bold; font-size: 16px; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 4px 10px rgba(0,242,153,0.3);">View Full Audit Breakdown</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <h3 style="color: #0b0f19; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Claim 20% to 30% Off Your Remaining Stack</h3>
        <p style="font-size: 15px; line-height: 1.6; color: #374151;">Credex buys verified pre-paid surplus credits from funded companies and makes them available to active startups at massive discounts. By pairing this audit with <strong>Credex Credits</strong>, your savings could multiply.</p>
        
        <p style="font-size: 15px; line-height: 1.6; color: #374151;">Schedule a quick 10-minute consultation call with a Credex advisor to unlock discounted credits for Claude, OpenAI, and Cursor:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://calendly.com/credex-audit" style="background-color: #0b0f19; color: #ffffff; font-weight: bold; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Schedule 10-Min Credit Consult</a>
        </div>

        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 40px;">This spend audit was compiled automatically in compliance with private software billing standards. All rights reserved by Credex.</p>
      </div>
    `;

    // 4. Send email using Resend (or fall back to local console mock)
    if (resend) {
      console.log(`[Email] Sending transactional confirmation to ${email} via Resend...`);
      try {
        await resend.emails.send({
          from: 'Credex Audit <audit@credex.rocks>',
          to: [email],
          subject: `Your Startup AI Spend Audit: Save $${results.totalMonthlySavings}/mo!`,
          html: emailHtmlBody
        });
      } catch (err) {
        console.error('[Email] Resend API failed, falling back to local output logs:', err);
        logEmailFallback(email, results.totalMonthlySavings, emailHtmlBody);
      }
    } else {
      console.log('[Email] Resend API Key is missing. Simulating email dispatch gracefully...');
      logEmailFallback(email, results.totalMonthlySavings, emailHtmlBody);
    }

    // 5. Update lead details and summary in the database
    await updateAuditLead(auditId, {
      email,
      name,
      role,
      company,
      aiSummary
    });

    return NextResponse.json({ success: true, aiSummary });
  } catch (error: any) {
    console.error('Error submitting lead info:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred while updating lead info.' },
      { status: 500 }
    );
  }
}

/**
 * Creates a highly customized, finance-literate spend summary if Claude is unavailable.
 */
function getLocalSummaryFallback(results: any, teamSize: number, useCase: string): string {
  // Find highest saving tool to write a customized paragraph
  const sortedBreakdown = [...results.breakdown].sort((a, b) => b.savings - a.savings);
  const topSaving = sortedBreakdown[0];

  if (results.totalMonthlySavings === 0) {
    return `Our audit engine confirms your active AI tool licenses are fully optimized. Your active seats align perfectly with your team size of ${teamSize}, and you have zero overlapping general-purpose chat or IDE autocompletion redundancies. Maintain your current setup and leverage pay-as-you-go keys as you scale to sustain operational efficiency.`;
  }

  let coreObservation = '';
  if (topSaving && topSaving.savings > 0) {
    if (topSaving.recommendedAction.startsWith('Reduce Seats')) {
      coreObservation = `The primary source of waste is over-provisioned seat counts on ${topSaving.toolName}, where paying for idle ghost seats accounts for $${topSaving.savings}/mo in immediate losses.`;
    } else if (topSaving.recommendedAction.startsWith('Cancel')) {
      coreObservation = `A major double-spending vulnerability was detected on ${topSaving.toolName}. Standardizing your team on a single platform avoids license overlaps.`;
    } else {
      coreObservation = `Transitioning ${topSaving.toolName} to the recommended ${topSaving.recommendedPlan} tier handles your developer throughput at a fraction of the cost.`;
    }
  }

  return `Your stack shows clear optimization opportunities, capturing $${results.totalMonthlySavings}/mo in redundant AI tool overhead. ${coreObservation} Consolidating overlapping assistants (Claude and ChatGPT) to support a dedicated '${useCase}' workflow cuts administrative waste without sacrificing output velocity. Implementing these adjustments immediately boosts startup cash efficiency.`;
}

/**
 * Helper to log simulated email sends to terminal stdout in absolute clarity.
 */
function logEmailFallback(email: string, monthlySavings: number, htmlContent: string) {
  console.log('\n=================== MOCK TRANSACTIONAL EMAIL SENT ===================');
  console.log(`[TO]: ${email}`);
  console.log(`[SUBJECT]: Your Startup AI Spend Audit: Save $${monthlySavings}/mo!`);
  console.log('[MOCK SMTP STATUS]: 250 OK - Transactional dispatch simulated.');
  console.log('=====================================================================\n');
}
