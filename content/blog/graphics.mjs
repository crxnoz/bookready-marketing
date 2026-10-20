// In-article graphics, rendered by content/blog-tools/graphics.mjs into
// images/blog/<key>-<name>.webp (1200x1500) and -720.webp.
//
// RULE, and it is the only one that matters: every word here must already
// appear in the article. A graphic is a summary of something the article
// already says. It never introduces a fact, a number, a price or a claim, and
// it is held to the same accuracy rules as the article (no invented figures,
// no made-up quotes, Google's review rules, no em dashes).
//
// Only make one when it genuinely summarises something: a set of steps, a
// checklist, a comparison, a decision, a list of costs, a policy worth copying.
// If it would only repeat one short paragraph, skip it.
//
// Shared fields on every entry:
//   key    the article's key
//   name   a short word for this graphic, used in the file name
//   type   steps | checklist | dodont | compare | costs | policy | flow
//   label  the pillar label, printed small at the top right
//   title  the graphic's headline, in Fraunces
//   alt    full-sentence alt text saying what the graphic shows
//
// Per type:
//   steps     steps: [[title, detail?], ...]            note?
//   checklist items: [item | [item, detail], ...]       note?
//   dodont    doLabel, do: [...], noLabel, no: [...]
//   compare   cols: [a, b], rows: [[label, a, b], ...]  note?
//   costs     aLabel, aSub?, a: [[thing, amount], ...], bLabel, bSub?, b: [...], note?
//   policy    lines: [...]                              note?
//   flow      ifLabel?, rows: [[situation, what to do], ...]  note?

export const GRAPHICS = [
  {
    key: 'how-deposits-work-for-appointments', name: 'money', type: 'steps', label: 'Money on the table',
    title: 'Where a deposit actually goes',
    alt: 'Four steps following a deposit from the moment a client books, into your own account, off the total at the appointment, and what happens if they cancel.',
    steps: [
      ['They book, and the money moves', 'A deposit is a real charge, not a hold on the card.'],
      ['It lands in your own account', 'Through a card processor into an account in your name, minus the processor’s cut.'],
      ['At the appointment it comes off the total', 'A $90 lash fill with a $20 deposit leaves a $70 balance.'],
      ['A cancellation depends on your window', 'Outside it, refund or carry it. Inside it, or a no-show, you keep it.'],
    ],
    note: 'Whatever you pick, they have to have read it before they paid.',
  },
  {
    key: 'website-for-a-barbershop', name: 'order', type: 'steps', label: 'Your own site',
    title: 'A barbershop page, in the order that matters',
    alt: 'The eight things a barbershop website needs, numbered in order of how many clients you lose when you skip each one.',
    steps: [
      ['A book button before anyone scrolls'],
      ['Services with a price and a duration'],
      ['Your hours, and whether you are open right now'],
      ['Where you are, with a map link'],
      ['Photos of real work, yours'],
      ['The barbers, with names'],
      ['The policies, a sentence each'],
      ['A phone number that dials when tapped'],
    ],
    note: 'Build only the first four and you still have a working barbershop site.',
  },
  {
    key: 'booth-rent-vs-commission', name: 'stay', type: 'flow', label: 'Going solo',
    title: 'Who should stay on commission',
    alt: 'Three situations in which commission is still the better deal, and the one situation in which booth rent starts to pay.',
    ifLabel: 'Where you are now',
    rows: [
      ['You are still building a book', 'Stay on commission. Under your break-even most weeks, rent is the worse deal.'],
      ['You want the front desk', 'Stay on commission. Someone answering the phone and rebooking for you is a real thing you are buying.'],
      ['Your income swings month to month', 'Stay on commission. A fixed weekly bill punishes an uneven calendar.'],
      ['You are steadily above your break-even', 'Rent starts to pay, and keeps widening.'],
    ],
    note: 'Going independent is not a promotion. It is a different job with different risks.',
  },
  {
    key: 'is-booksy-worth-it', name: 'count', type: 'steps', label: 'Switching',
    title: 'Count your last thirty bookings',
    alt: 'Three buckets for sorting your last thirty appointments, to work out whether a marketplace is still finding you new clients.',
    steps: [
      ['A genuinely new person who found you inside the app', 'They searched for a service and you came up.'],
      ['A regular', 'Somebody who has sat in your chair before and would have found you anyway.'],
      ['Someone you sent there yourself', 'Your Instagram bio link, a DM, a text, the card you hand out.'],
    ],
    note: 'Count bucket one. If it is one or two, you are paying for distribution you have stopped using.',
  },
  {
    key: 'free-salon-booking-software', name: 'four', type: 'flow', label: 'Switching',
    title: 'Four kinds of free',
    alt: 'The four things free booking software usually turns out to be, and what each one really costs.',
    ifLabel: 'Free because',
    rows: [
      ['It is a trial that ends', 'Not free, just later. Ask what happens to your bookings on the day it ends.'],
      ['The platform takes a cut, or your client pays a booking fee', 'A real cost, moved. Work out the cost per booking rather than per month.'],
      ['The card processing rate is higher', 'A subscription with a different name. Apply each rate to last month’s takings.'],
      ['It is a free tier of a paid product', 'Free in the plain sense. The question is whether the limits are ones you will hit.'],
    ],
    note: 'Check you can export your client list before you commit it.',
  },
  {
    key: 'what-is-double-booking', name: 'overlap', type: 'dodont', label: 'Running the week',
    title: 'Overlapping two clients',
    alt: 'Two panels: the four conditions under which deliberately overlapping two clients works, and the four situations where it reliably fails.',
    doLabel: 'It works when',
    do: [
      'There is an unbroken run of fifteen or more minutes that does not need you',
      'The second service finishes inside the gap',
      'The hands-on moments never land together',
      'You told the client before they booked, not while it is happening',
    ],
    noLabel: 'It fails when',
    no: [
      'The first client finishes early',
      'Either client is late',
      'The second service has no flexibility',
      'The client is partly paying for your attention',
    ],
  },
  {
    key: 'the-squeeze-in', name: 'three', type: 'checklist', label: 'Running the week',
    title: 'Three conditions, and all three have to be true',
    alt: 'The three conditions that make a last minute squeeze-in safe: a short service, a real gap, and a client you want more of.',
    items: [
      ['It is a short service', 'A polish change, a brow wax, a fringe trim.'],
      ['There is a real gap', 'A cancellation, an unbooked hour, a late start tomorrow.'],
      ['It is a client you want more of', 'Someone who shows up, pays and rebooks.'],
    ],
    note: 'Two out of three is a no. The honest answer is a waitlist place, not a yes.',
  },
  {
    key: 'card-on-file-for-appointments', name: 'wording', type: 'policy', label: 'Money on the table',
    title: 'Card on file, in four lines',
    alt: 'The four lines of booking page wording that cover a cancellation window, the fee, the card and lateness.',
    lines: [
      'Free to cancel or reschedule up to 24 hours before your appointment.',
      'Inside 24 hours, or a no-show, is 50% of the service price.',
      'Booking saves your card for that charge only. Nothing is taken today.',
      'Running late? Message me. Under 15 minutes is usually fine.',
    ],
    note: 'Short, neutral, and states the condition: the window, the amount, and that the card is charged only if that happens.',
  },
  {
    key: 'how-many-clients-per-day', name: 'signs', type: 'checklist', label: 'Running the week',
    title: 'The signs you have already crossed it',
    alt: 'Five signs that a day holds more clients than it should, from the last client getting the worst version of you to complaints in work you would normally be proud of.',
    items: [
      'Your last client gets the worst version of you',
      'You stop asking for the rebooking, because you want them to leave',
      'Replies slip to tomorrow, then to the day after',
      'You eat standing up, or you do not eat',
      'Complaints show up in work you would be proud of on a normal day',
    ],
    note: 'These are capacity readings, not character flaws.',
  },
];
