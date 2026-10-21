---
key: export-clients-from-acuity
section: guides
slug: export-clients-from-acuity
title: How to export your client list from Acuity Scheduling. Five clicks, one CSV.
metaTitle: How to Export Your Client List From Acuity | BKRDY
description: Step-by-step guide to exporting your client list from Acuity Scheduling as a CSV, with notes on appointment history, intake forms, and what to do next.
date: 2026-06-18
pillar: switching
keywords: export clients from acuity, export clients from acuity
photo: export-clients-from-acuity
photoAlt: Small beauty studio
status: published
migrated: true
---

Your client list belongs to you, not to your scheduling platform. That sounds obvious, but it is easy to forget when years of names, emails, and notes live inside a tool you log into every day. Acuity makes the export reasonably straightforward, with a few catches worth knowing before you start. This guide walks through the exact path to pull your client list as a CSV, what Acuity does and does not include in that file, how to handle appointment history (which is messier), and what to do with the file once you have it.

It is part of the BKRDY migration series, so if you are leaving Acuity, the short version is that we run the import for free. But the steps here work whether you are switching, building a backup, or just want a copy of your own data. If you decide to move, our [migration guide](/migration/) picks up where this one ends. Either way, by the end you will have a clean file you own outright, and a plan for keeping it current. No jargon, no upsell pressure, just the clicks.

## Download your list even if you are staying.

Exporting is worth doing regardless of whether you ever plan to leave Acuity. There are three reasons, and none of them require you to be unhappy with your current setup.

First, data ownership and backup hygiene. Your client list is one of the most valuable assets your business has, and keeping it in exactly one place, inside one vendor's account, is a single point of failure. A downloaded copy is cheap insurance. Second, it lets you run a one-off email campaign outside Acuity when you need to, whether that is a holiday promotion through your own email tool or a quick note to lapsed clients. Third, it protects you if your account ever gets locked, suspended, or caught in a billing problem. If you cannot log in, you cannot export, and a backup taken last month suddenly matters a lot.

It is also worth remembering that Acuity is owned by Squarespace now. That is not a criticism, but it does mean the roadmap, pricing, and policies can shift without much warning, as they can with any platform under a larger parent. Owning a current copy of your own data means those changes are someone else's problem, not yours.

## Log in and find the Clients tab.

Start by logging in at acuityscheduling.com. In 2026, most owners land in one of two places: the unified Squarespace login, if your account has been migrated to the shared platform, or the legacy Acuity login, if it has not. Both lead to the same scheduling dashboard, so do not worry if the sign-in screen looks different from a screenshot you saw last year.

Once you are in, look for Clients in the left-hand navigation. This is the one you want. Be careful not to confuse it with Contacts, which is a separate Squarespace-wide list that does not hold your scheduling data the same way. The Clients tab is specifically your booking clients, with their appointment counts and notes attached.

One thing to check before you go further: you need to be on the admin account, not a staff seat. Staff logins often have the export option hidden or disabled, so if you do not see the controls described in the next step, that is usually why. Switch to the owner login, confirm you can see the full client list, and then continue. If you manage clients across the business, the same data lives in your BKRDY [customer accounts](/platform/tools/customers/) once you migrate.

## Export the full client CSV.

With the Clients tab open, look to the top right for the Import/Export button. Click it, then choose Export client list. Acuity will ask for a format: select CSV, which opens cleanly in any spreadsheet tool. Next you can choose which clients to include. The simplest option is All clients, though you can filter by a date range if you only want people seen in, say, the last two years.

Click Download and the file will generate. For most accounts this takes under a minute, even with a few thousand clients. The export includes the core fields you care about: name, email, phone, notes, total number of appointments, and total revenue per client. That last pair is genuinely useful, because it lets you spot your highest-value regulars at a glance when you import somewhere new.

Here is the catch worth flagging now. The client CSV does not include intake form responses by default. If you collect health histories, patch-test confirmations, or detailed preferences through Acuity intake forms, those answers are not in this file. We cover how to get them in the next step, so do not assume the job is done just because the main list downloaded.

## Export intake forms and appointment history.

This is the harder part, and it is worth being honest about. Acuity does not let you export appointment history as cleanly as the client list, and intake forms come out separately. Budget 30 to 60 minutes for a complete, tidy export if you have a busy account.

You have three paths. First, for appointment history, go to the Reports section and export appointment reports as a CSV by date range. This gives you the record of who came in and when, though it arrives less polished than the client list and usually needs sorting in a spreadsheet. Second, for intake form responses, you have to export each form individually from the Customize Appearance area under Intake Forms. There is no single button that bundles every form's answers together, so work through them one at a time.

Third, if you run a high-volume account and the per-form export feels endless, contact Acuity support and ask for a full data dump. They can often provide a more complete export on request, which saves you the manual clicking. Whichever path you take, do this before you cancel anything, because access to these exports ends when your subscription does.

## Clean your CSV before importing anywhere.

A raw export is rarely import-ready. Ten minutes of cleanup now saves headaches later, whether the file is going into a new platform or a backup folder. Open the CSV in Google Sheets or Excel and work through a short checklist.

Start by deleting duplicate rows, which usually show up as the same email appearing two or three times because a client booked under slightly different details over the years. Next, verify the email column actually contains emails, not placeholder text like "no email on file" that some older accounts store as a literal string. Then standardize the phone format if you can, so numbers are consistent rather than a mix of dashes, dots, and country codes. Finally, add a new column to flag your VIP or highest-revenue clients, using the total revenue field from the export as your guide. That tag makes it easy to set up loyalty or priority booking on your next platform.

If this sounds tedious, it is, and you do not have to do it alone. When you migrate to BKRDY, we run this cleanup for you as part of the free import, deduping and validating the file so you do not have to touch a spreadsheet at all.

## Import it, or keep it as a backup.

Once your file is clean, there are two paths, and they are not mutually exclusive.

**Path A: import into a new platform.** If you are moving to BKRDY, you do not need to format anything special. Send us the CSV during migration and we run the import the same day, free, bringing over names, emails, phones, and notes. Most setups are live within hours, and we flag anything that looks off so you can confirm it. The full process is laid out on the [migration page](/migration/), and you can see plan options on the [pricing page](/pricing/) if you are still deciding.

**Path B: keep it as a backup.** If you are staying on Acuity for now, still hold onto the file properly. Save it to two places, a cloud drive plus a local copy, so a single lost laptop does not erase it. Tag the file name with the export date so you always know how fresh it is. Then set a calendar reminder to re-export every 90 days. A backup you took once and forgot is barely a backup at all.

## What Acuity will not export.

A clean client list is most of the value, but a few things simply do not come out in any export. Knowing this upfront saves you from discovering a gap after you have already cancelled.

Reviews collected on Acuity stay on Acuity, so if testimonials matter to you, screenshot them before you go. Your automated email content stays locked in Acuity's templates and does not transfer, which means you rebuild those messages on your next platform rather than migrating them. Custom intake forms have to be exported separately, as covered in Step 3, and are easy to forget. Integrations such as Zapier, Zoom, or calendar connections do not move with your data and need to be reconnected wherever you land. And recurring appointments do not carry their future dates across, so standing weekly or monthly slots have to be rebuilt.

The simplest safeguard for all of this is a screenshot. Anything you want to remember but cannot export, capture it as an image before your subscription ends. It is low effort and it means nothing important disappears the day your access does. If you are weighing the move, our [Acuity alternative comparison](/compare/acuity-alternative/) covers what changes after the switch.

## Ready to migrate? Here is what happens next.

If the export was the first step toward switching, the rest is lighter than you might expect. Start a BKRDY trial, send us your cleaned CSV, and we handle the import. Most migrations finish within a day, with services, hours, staff, and clients all brought across so you are not rebuilding from scratch.

You can build your site and review the imported data on Starter, which is free forever with no card, before committing to anything. A paid plan starts with 7 days free, with a card on file. Solo pros in particular tend to be live the same day. If you want the full picture first, read the [migration guide](/migration/), check plans on the [pricing page](/pricing/), or see how the two platforms stack up on our [Acuity alternative comparison](/compare/acuity-alternative/). Built for one-person businesses? The [solo pros page](/for-solo-pros/) shows what a designed site looks like for a team of one.

## Questions

### Does Acuity charge to export my client list?

No. The client export is included on every Acuity plan, including the legacy free tier. There is no add-on fee and no upgrade required. You can download your list as many times as you want at no cost.

### Can I export past appointment history?

Yes, through the Reports tab as a date-range CSV. It is less clean than the client list export and may need some sorting in a spreadsheet, but it is workable. For a complete history dump on a large account, contact Acuity support and ask for a full export.

### Does the export include intake form answers?

Not in the main client CSV. Intake responses have to be exported separately, per form, from the Customize Appearance section. If intake answers matter to you, export each form before you cancel anything.

### Will exporting my data cancel my Acuity subscription?

No. Exporting does not affect your subscription in any way. Your account keeps running exactly as before. Cancel separately when you are ready, and only after you have verified that your export downloaded correctly and opens cleanly.

### Can BKRDY import the Acuity CSV directly?

Yes. Send it to us during the free migration and we run the import for you. Most setups are live the same day, with services, hours, staff, and clients all brought over. You do not need to format anything special first.

### What if my CSV is missing emails or phones?

That is common with older Acuity accounts where some clients were added by hand. Clean the file in Google Sheets or Excel first if you can, then send it. We import whatever contact details you have and flag the gaps for you.

### Do automated reminder emails transfer?

No. Reminder templates and automations stay inside Acuity and do not export. BKRDY ships its own reminder system that you set up in the dashboard, so you rebuild the few messages you use rather than migrating them.

### How often should I export as a backup?

Quarterly at a minimum, and monthly if you are running active marketing. Treat your client list like your phone backup: boring, automatic, and non-negotiable. A five-minute export every 90 days protects years of relationships.
