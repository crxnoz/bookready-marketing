---
key: no-show-fee-policy
section: guides
slug: no-show-fee-policy
title: How to write a no-show fee policy that actually works. Visible at booking. Confirmed in reminders. Charged without drama.
metaTitle: No-Show Fee Policy: How to Write One That Holds | BKRDY
description: How to write and enforce a no-show fee policy that protects your time without alienating clients. Templates, scripts, and the documentation that wins disputes.
date: 2026-07-01
pillar: money
keywords: no show fee policy, no show fee
photo: no-show-fee-policy
photoAlt: Barbershop interior
status: published
migrated: true
---

A no-show fee policy is not the same thing as a cancellation policy, and treating them as one is why so many of them fall apart. A cancellation policy covers the client who tells you they cannot make it. You get warning, you might rebook the slot, and the conversation is civil. A no-show policy covers the client who says nothing and simply does not turn up. There is no warning, the slot is dead, and the loss is total.

That difference changes everything about how you write and enforce the policy. The math is harder, because a same-day empty chair almost never rebooks. The documentation requirement is higher, because you will sometimes have to defend the charge to a bank. And the enforcement is more delicate, because you are billing someone who is already annoyed at themselves and looking for a reason to be annoyed at you instead.

This guide walks through the whole thing in order: what makes a no-show fee actually enforceable, how much to charge, the exact policy language to use, the three places it has to appear, how to set up auto-charging, the message that goes out afterward, how to win a payment dispute, and how to handle repeat offenders without torching the relationship.

## What makes a no-show fee enforceable.

A no-show fee is not something you can invent after the fact. For it to hold up, three things have to be true, and all three are about consent given before the appointment.

First, the policy has to be visible at the moment of booking, before the client confirms. A fee buried in a footer nobody reads does not count. It needs to sit next to the Confirm button where a reasonable person would see it. Second, the client has to take an action that signals agreement. Clicking Confirm on a booking page that clearly discloses the fee is exactly that: an affirmative step taken with the terms in view. Third, the amount has to be reasonable in proportion to the service. A $200 fee on a $40 haircut looks punitive and gives a bank an easy reason to side with the client.

When a client disputes the charge later, the card network does not care how you felt about it. They care about disclosure. Stripe disputes lean almost entirely on whether you can show the client saw the policy and agreed to it. That is why enforceability is built at booking time, not at charge time. Handle the money side properly with [Stripe-backed payments](/platform/tools/payments/) and the disclosure is captured for you automatically.

## How much to charge for a no-show.

Charge 100% of the service price. That is the honest number, because the loss is total. When someone cancels with notice, you have a chance to fill the slot. When they no-show, the appointment is already gone by the time you know, and a same-day gap almost never rebooks. You did not lose part of the booking. You lost all of it.

People reach for softer options here, usually 50% of the service or a small flat fee like $25. The logic feels fair, but it sends the wrong signal. A partial fee tells clients the policy is negotiable, and a policy that looks negotiable gets tested. A flat $25 fee on a $90 appointment is not a deterrent, it is a rounding error. The point of the fee is not to recover pennies, it is to make the slot worth respecting.

Bridal, group bookings, and long multi-service appointments deserve special treatment. Those slots block hours of your day and often involve product or prep you cannot recover, so charge 100% of the service plus any product loss, and take a deposit up front on top of it. If you are still deciding how deposits and fees fit together, our guide on [deposit best practices](/guides/deposit-best-practices/) covers where each one earns its place.

## The exact no-show fee policy language to use.

Keep the wording plain. It should read like a clear expectation, not a legal threat. Here is language you can lift directly and adjust with your own numbers.

**No-show policy.** If you do not arrive within [15] minutes of your appointment time without notice, the full cost of the service will be charged to the card on file. To cancel or reschedule without a fee, please do so through your booking confirmation at least [24] hours in advance. Cancellations by text or DM to a personal number cannot be accepted. Repeat no-shows may be required to prepay for all future bookings.

Notice what the bracketed fields do. The grace period ([15] minutes) sets an unambiguous line for when someone counts as a no-show. The advance window ([24] hours) separates a no-show from a normal cancellation. The channel requirement (through your booking confirmation) closes the "but I texted you" loophole before it opens. And the repeat-offender clause plants the seed for prepayment later without you having to spring it as a surprise.

Adjust the numbers to your services. Short cuts can use a 15-minute grace period, while color, lashes, or facials that take two hours or more warrant 20 to 30 minutes and a 48-hour cancellation window. Whatever you set, write it once, in one place, and reuse the exact same wording everywhere the policy appears.

## The three places this policy must appear.

A no-show fee is only as strong as its weakest point of disclosure. If the policy is invisible in any one of these three places, a disputed charge gets much harder to defend. Put the same wording in all three.

First, on the booking page, before the client confirms. This is the one that matters most, because it is where consent is captured. The client should not be able to reach the Confirm button without the policy being in plain view. Second, in the confirmation email and SMS that goes out the moment they book. This creates a timestamped record that the terms were delivered, and it puts the fee in front of the client a second time while the booking is fresh. Third, in the reminder that goes out 24 to 48 hours before the appointment, which is both a courtesy and a paper trail.

The reason for the redundancy is simple: each touchpoint is another piece of evidence, and together they make a dispute nearly unwinnable for the client. Automated [confirmations and reminders](/platform/tools/notifications/) do this without you lifting a finger, so the policy rides along on every message instead of depending on you to remember. For the broader playbook on cutting missed appointments, see our guide on [reducing no-shows](/guides/reducing-no-shows/).

## How to auto-charge a no-show in BKRDY.

Automating the charge removes the worst part of the whole process: the moment where you have to decide, in real time and with your emotions involved, whether to bill someone. Set it once and let the system enforce it evenly for everyone.

Start by requiring a card at booking. In Settings, Payments, turn on Card on File Required at Booking. This is available on the Studio and Salon plans and is the piece that makes auto-charging possible at all, because you cannot bill a card you never captured. Then go to Settings, Policies, No-Show Fee, and set two things: the amount (100% of the service, per the section above) and the timing. By default the fee charges one hour after the missed appointment, which gives you a short window to cancel it if the client turns up late or there was a genuine mix-up.

The Solo plan works a little differently. It supports deposits at booking, which cover a lot of the same ground, but it does not store full cards for later charging, so no-show fees on Solo are collected manually from the dashboard. If no-shows are a recurring problem for you, that alone is a reason to look at Studio. Either way, the underlying billing runs on [Stripe](/platform/tools/payments/), so the charge and its disclosure record are handled cleanly.

## The SMS script that goes out after a no-show.

The message you send after a no-show sets the tone for whether this becomes a quiet transaction or a fight. Keep it factual, warm, and brief. You are stating what happened and what the policy does, not scolding anyone.

Hi [name], we missed you at your [2:30] appointment today. As per the booking policy, the $[X] no-show fee will be charged to the card on file. If you would like to rebook, just reply and we will find you a fresh slot.

Every line is doing work. Naming the appointment time signals that this is a real record, not a random charge. "As per the booking policy" points back to the terms they already agreed to, which reframes the fee as something they knew about rather than something you sprang on them. Ending with an open door to rebook keeps the relationship intact and turns an awkward moment into a chance to keep the client.

When they reply, keep it just as short. If they apologize and want to rebook, book them and move on without a lecture. If they push back, do not argue over text. Point them once to the policy they confirmed at booking, state that the charge stands, and offer to talk if they have a genuine concern. A calm, one-line response almost always ends it faster than a paragraph.

## Winning Stripe disputes on no-show charges.

Occasionally a client will dispute the charge with their bank instead of talking to you. This is not a crisis. If you set the policy up properly, a dispute is mostly a paperwork exercise, and clean documentation wins the large majority of the time.

Here is the playbook. When the dispute lands, Stripe gives you roughly seven days to respond, so do not sit on it. Gather your evidence: a screenshot of the policy as it appeared on the booking page, the confirmation email and SMS showing the terms were delivered, the reminder that went out before the appointment, and the booking timeline showing when the client confirmed. Upload all of it through the Stripe dashboard as your dispute response. Then wait, because the card network makes the final call, typically within 60 to 75 days.

The pattern is consistent: whoever has the cleaner documentation wins, and that is almost always the business when the policy was disclosed at every step. In practice, well-documented no-show disputes resolve in the merchant's favor somewhere in the range of 75 to 85% of the time. The 15 to 25% that slip through are usually cases where the policy was vague, invisible at booking, or the fee looked wildly out of proportion. Get the earlier sections right and disputes stop being something you dread. If you want the full switching and setup context, the [salon platform overview](/for-salons/) ties the pieces together.

## Handling repeat offenders without burning the relationship.

A single no-show is usually life happening. A pattern is a different problem, and it needs an escalating response that is firm on the money but easy on the person. A simple three-strike system keeps you consistent and keeps you from making the call in the heat of the moment.

On the first no-show, charge the fee and offer to rebook, exactly as covered above. On the second, charge the fee again and require a deposit on all future bookings. This is where the earlier policy language earns its keep, because you warned them at booking that repeat no-shows may require prepayment, so it is not a surprise. On the third, you are within your rights to decline future bookings entirely or require full prepayment before you will hold a slot. At that point the client has told you, three times, how much they value your time.

For the deposit conversation, keep it warm and matter-of-fact: "Hi [name], happy to get you back on the books. Since we have had a couple of missed appointments, future bookings will need a deposit to hold the slot. You can book anytime through the usual link." No blame, no drama, just the new terms. Most clients accept it without complaint, and the ones who walk away were costing you money anyway. Deposits handle this quietly, and our [deposit guide](/guides/deposit-best-practices/) and [cancellation policy template](/guides/cancellation-policy-template/) show how to wire the whole system together. When you are ready to set it up, see [pricing](/pricing/) for the plan that fits.

## Questions

### Can a client refuse to pay a no-show fee?

A client can dispute the charge with their bank, but they cannot simply refuse it if the card is on file and your policy was disclosed. When your documentation is clean, the dispute almost always resolves in your favor within a couple of months.

### Should the no-show fee be 100% of the service?

Yes. The chair sat empty and the loss was total, so the fee should be too. Charging 50% or a small flat fee signals that the policy is negotiable, which invites more no-shows.

### What if the client never gave a card at booking?

Then you cannot auto-charge anything. The fix is to require a card on file for every booking, which BKRDY supports on the Studio and Salon plans. The Solo plan allows deposits but not stored cards, so no-show fees there are collected manually.

### What is the grace period before someone counts as a no-show?

The standard is 15 minutes for short services and 20 to 30 minutes for longer ones like color or lash sets. Whatever you choose, state it explicitly in the policy so there is no argument later.

### Can I waive a no-show fee?

Yes, for genuine emergencies with a brief bit of context. Do not waive it for vague reasons like "something came up." Inconsistent waiving trains clients to expect an exception, which quietly breaks the whole policy.

### Does BKRDY automatically charge the fee?

Yes, on the Studio and Salon plans. You set the amount and timing in Settings, Policies, and the fee charges the card on file after the missed appointment. On the Solo plan you charge it manually from the dashboard.

### What if a client says they texted to cancel?

A text to your personal number does not count if your policy requires cancellation through the booking system. State that requirement explicitly so a screenshot of a random text is not a valid excuse.

### Are no-show fees taxable income?

Yes, in most jurisdictions. Treat the fee as service revenue in your bookkeeping. Rules vary by state, so confirm the specifics with your accountant.
