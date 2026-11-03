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

This guide walks through the whole thing in order: what makes a no-show fee actually enforceable, how much to charge, the exact policy language to use, the three places it has to appear, how to charge the fee, the message that goes out afterward, how to win a payment dispute, and how to handle repeat offenders without torching the relationship.

## What makes a no-show fee enforceable.

A no-show fee is not something you can invent after the fact. For it to hold up, three things have to be true, and all three are about consent given before the appointment.

First, the policy has to be visible at the moment of booking, before the client confirms. A fee buried in a footer nobody reads does not count. It needs to sit next to the Confirm button where a reasonable person would see it. Second, the client has to take an action that signals agreement. Clicking Confirm on a booking page that clearly discloses the fee is exactly that: an affirmative step taken with the terms in view. Third, the amount has to be reasonable in proportion to the service. A $200 fee on a $40 haircut looks punitive and gives a bank an easy reason to side with the client.

When a client disputes the charge later, the card network does not care how you felt about it. They care about disclosure. Stripe disputes lean almost entirely on whether you can show the client saw the policy and agreed to it. That is why enforceability is built at booking time, not at charge time. Handle the money side properly with [Stripe-backed payments](/platform/tools/payments/) and turn on the policy agreement at booking, so the disclosure is part of every booking.

## How much to charge for a no-show.

Charge 100% of the service price. That is the honest number, because the loss is total. When someone cancels with notice, you have a chance to fill the slot. When they no-show, the appointment is already gone by the time you know, and a same-day gap almost never rebooks. You did not lose part of the booking. You lost all of it.

People reach for softer options here, such as 50% of the service or a small flat fee like $25. The logic feels fair, but it sends the wrong signal. A partial fee tells clients the policy is negotiable, and a policy that looks negotiable gets tested. A flat $25 fee on a $90 appointment is not a deterrent, it is a rounding error. The point of the fee is not to recover pennies, it is to make the slot worth respecting.

Bridal, group bookings, and long multi-service appointments deserve special treatment. Those slots block hours of your day and often involve product or prep you cannot recover, so charge 100% of the service plus any product loss, and take a deposit up front on top of it. If you are still deciding how deposits and fees fit together, our guide on [deposit best practices](/guides/deposit-best-practices/) covers where each one earns its place.

## The exact no-show fee policy language to use.

Keep the wording plain. It should read like a clear expectation, not a legal threat. Here is language you can lift directly and adjust with your own numbers.

**No-show policy.** If you do not arrive within [15] minutes of your appointment time without notice, the full cost of the service will be charged to the card on file. To cancel or reschedule without a fee, please do so through your booking confirmation at least [24] hours in advance. Cancellations by text or DM to a personal number cannot be accepted. Repeat no-shows may be required to prepay for all future bookings.

Notice what the bracketed fields do. The grace period ([15] minutes) sets an unambiguous line for when someone counts as a no-show. The advance window ([24] hours) separates a no-show from a normal cancellation. The channel requirement (through your booking confirmation) closes the "but I texted you" loophole before it opens. And the repeat-offender clause plants the seed for prepayment later without you having to spring it as a surprise.

Adjust the numbers to your services. Short cuts can use a 15-minute grace period, while color, lashes, or facials that take two hours or more warrant 20 to 30 minutes and a 48-hour cancellation window. Whatever you set, write it once, in one place, and reuse the exact same wording everywhere the policy appears.

## The three places this policy must appear.

A no-show fee is only as strong as its weakest point of disclosure. If the policy is invisible in any one of these three places, a disputed charge gets much harder to defend. Put the same wording in all three.

First, on the booking page, before the client confirms. This is the one that matters most, because it is where consent is captured. The client should not be able to reach the Confirm button without the policy being in plain view. Second, in the confirmation email and SMS that goes out the moment they book. This creates a timestamped record that the terms were delivered, and it puts the fee in front of the client a second time while the booking is fresh. Third, in the reminder that goes out 24 to 48 hours before the appointment, which is both a courtesy and a paper trail.

The reason for the redundancy is simple: each touchpoint is another piece of evidence, and together they make a dispute nearly unwinnable for the client. Once you add the policy line to the email templates, automated [confirmation and reminder emails](/platform/tools/notifications/) do this without you lifting a finger, so the policy rides along on every one instead of depending on you to remember. BKRDY's text wording is fixed, so the line lives in the email. For the broader playbook on cutting missed appointments, see our guide on [reducing no-shows](/guides/reducing-no-shows/).

## How to charge a no-show fee in BKRDY.

BKRDY does not charge the fee on its own. You decide, appointment by appointment, which means a genuine mix-up never costs anyone money. The way to keep that decision even-handed is to write the rule down and apply it the same way every time.

Start with the saved card, because you cannot bill a card you never captured. On Solo, Studio and Studio+, clients can save a card at booking with their consent. Turn that on under Settings, Payment rules, and set your no-show fee and late cancellation fee there too, as a set amount. When a client misses an appointment, mark it a no-show, open it, and charge the fee to the saved card. A client who did not save one has only their deposit at stake.

The Free plan works a little differently. It supports deposits at booking, which cover a lot of the same ground, but it does not save cards or charge fees, so the deposit is your protection. If no-shows are a recurring problem for you, that alone is a reason to look at a paid plan. Either way, the underlying billing runs on [Stripe](/platform/tools/payments/), so the charge and its record are handled cleanly.

## The SMS script that goes out after a no-show.

The message you send after a no-show sets the tone for whether this becomes a quiet transaction or a fight. Keep it factual, warm, and brief. You are stating what happened and what the policy does, not scolding anyone.

Hi [name], we missed you at your [2:30] appointment today. As per the booking policy, the $[X] no-show fee will be charged to the card on file. If you would like to rebook, just reply and we will find you a fresh slot.

Every line is doing work. Naming the appointment time signals that this is a real record, not a random charge. "As per the booking policy" points back to the terms they already agreed to, which reframes the fee as something they knew about rather than something you sprang on them. Ending with an open door to rebook keeps the relationship intact and turns an awkward moment into a chance to keep the client.

When they reply, keep it just as short. If they apologize and want to rebook, book them and move on without a lecture. If they push back, do not argue over text. Point them once to the policy they confirmed at booking, state that the charge stands, and offer to talk if they have a genuine concern. A calm, one-line response almost always ends it faster than a paragraph.

## Winning Stripe disputes on no-show charges.

Occasionally a client will dispute the charge with their bank instead of talking to you. This is not a crisis. If you set the policy up properly, a dispute is mostly a paperwork exercise, and clean documentation wins the large majority of the time.

Here is the playbook. When the dispute lands, Stripe gives you roughly seven days to respond, so do not sit on it. Gather your evidence: a screenshot of the policy as it appeared on the booking page, the confirmation email and SMS showing the terms were delivered, the reminder that went out before the appointment, and the booking timeline showing when the client confirmed. Upload all of it through the Stripe dashboard as your dispute response. Then wait, because the card network makes the final call, typically within 60 to 75 days.

The pattern is consistent: whoever has the cleaner documentation wins, and that is almost always the business when the policy was disclosed at every step. Well-documented no-show disputes give you the best chance. The ones that get lost are usually cases where the policy was vague, invisible at booking, or the fee looked wildly out of proportion. Get the earlier sections right and disputes stop being something you dread. If you want the full switching and setup context, the [salon platform overview](/for-salons/) ties the pieces together.

## Handling repeat offenders without burning the relationship.

A single no-show is usually life happening. A pattern is a different problem, and it needs an escalating response that is firm on the money but easy on the person. A simple three-strike system keeps you consistent and keeps you from making the call in the heat of the moment.

On the first no-show, charge the fee and offer to rebook, exactly as covered above. On the second, charge the fee again and require payment up front on all future bookings. This is where the earlier policy language earns its keep, because you warned them at booking that repeat no-shows may require prepayment, so it is not a surprise. On the third, you are within your rights to decline future bookings entirely or require full prepayment before you will hold a slot. At that point the client has told you, three times, how much they value your time.

For the prepayment conversation, keep it warm and matter-of-fact: "Hi [name], happy to get you back on the books. Since we have had a couple of missed appointments, future bookings will need to be paid up front to hold the slot. Message me when you want to come in and I will send you the link." No blame, no drama, just the new terms. Most clients accept it without complaint, and the ones who walk away were costing you money anyway. BKRDY's deposit is one studio-wide rule, not a per-client one, so for a repeat offender you add the booking yourself and send a payment link. Our [deposit guide](/guides/deposit-best-practices/) and [cancellation policy template](/guides/cancellation-policy-template/) show how to wire the whole system together. When you are ready to set it up, see [pricing](/pricing/) for the plan that fits.

## Questions

### Can a client refuse to pay a no-show fee?

A client can dispute the charge with their bank, but they cannot simply refuse it if the card is on file and your policy was disclosed. When your documentation is clean, the dispute almost always resolves in your favor within a couple of months.

### Should the no-show fee be 100% of the service?

Yes. The chair sat empty and the loss was total, so the fee should be too. Charging 50% or a small flat fee signals that the policy is negotiable, which invites more no-shows.

### What if the client never gave a card at booking?

Then you cannot charge the fee to a card. In BKRDY, saving a card is the client's choice, on Solo, Studio and Studio+, so a client who did not save one is covered by the deposit instead. Ask them for the balance directly, or send a payment link.

### What is the grace period before someone counts as a no-show?

The standard is 15 minutes for short services and 20 to 30 minutes for longer ones like color or lash sets. Whatever you choose, state it explicitly in the policy so there is no argument later.

### Can I waive a no-show fee?

Yes, for genuine emergencies with a brief bit of context. Do not waive it for vague reasons like "something came up." Inconsistent waiving trains clients to expect an exception, which quietly breaks the whole policy.

### Does BKRDY automatically charge the fee?

No. On Solo, Studio and Studio+, you set the fee in Settings, Payment rules, and charge it to the client's saved card from the appointment when you decide to. A no-show fee is never charged on its own. A late cancellation fee is different: when a client with a saved card cancels through their link inside your late window, it is charged automatically and they get an email. The Free plan takes deposits but does not save cards or charge fees.

### What if a client says they texted to cancel?

A text to your personal number does not count if your policy requires cancellation through the booking system. State that requirement explicitly so a screenshot of a random text is not a valid excuse.

### Are no-show fees taxable income?

Yes, in most jurisdictions. Treat the fee as service revenue in your bookkeeping. Rules vary by state, so confirm the specifics with your accountant.
