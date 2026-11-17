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
//   title  the graphic's headline, in Plus Jakarta Sans
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
    key: 'how-deposits-work-for-appointments', name: 'money-night', type: 'steps', label: 'Money on the table',
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
    key: 'website-for-a-barbershop', name: 'order-night', type: 'steps', label: 'Your own site',
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
    key: 'booth-rent-vs-commission', name: 'stay-night', type: 'flow', label: 'Going solo',
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
    key: 'is-booksy-worth-it', name: 'count-night', type: 'steps', label: 'Switching',
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
    key: 'free-salon-booking-software', name: 'four-night', type: 'flow', label: 'Switching',
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
    key: 'what-is-double-booking', name: 'overlap-night', type: 'dodont', label: 'Running the week',
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
    key: 'the-squeeze-in', name: 'three-night', type: 'checklist', label: 'Running the week',
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
    key: 'card-on-file-for-appointments', name: 'wording-night', type: 'policy', label: 'Money on the table',
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
    key: 'how-many-clients-per-day', name: 'signs-night', type: 'checklist', label: 'Running the week',
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
  {
      key: 'vagaro-vs-fresha', name: 'fit-night', type: 'compare', label: 'Switching',
      title: 'Who each one genuinely suits',
      alt: 'A comparison of who Vagaro and Fresha each suit: the kind of business, what you want from it, how you pay, and how deep the setup goes.',
      cols: ['Vagaro', 'Fresha'],
      rows: [
        ['Your business', 'A multi-chair salon or spa', 'A pro or team still building your book'],
        ['You want', 'Payroll, retail and classes in one place', 'A low fixed monthly cost'],
        ['You pay', 'A subscription that grows with staff calendars', 'When the money moves, and a fee on new marketplace clients'],
        ['Feature depth', 'Deep, with a real learning curve', 'Lighter, quicker to set up'],
      ],
      note: 'If your book is mostly regulars, you are paying marketplace prices for clients you already have.',
    },
  {
    key: 'set-up-deposit-payments', name: 'setup-night', type: 'steps', label: 'Money on the table',
    title: 'Setting up deposits, in order',
    alt: 'Six steps for setting up deposits, from picking flat or percent and the amount to booking yourself as a test.',
    steps: [
      ['Pick flat or percent, and the amount', 'At 25%, a $60 manicure takes $15 and a $160 full set takes $40.'],
      ['Write the deposit policy in one paragraph', 'How much, that it comes off the total, cancel early, cancel late or do not turn up.'],
      ['Decide what happens when they cancel', 'Outside your window, refund it or carry it. Inside it, or a no-show, you keep it.'],
      ['Connect a payment processor in your own name', 'Ask the question directly: whose account does the money go into?'],
      ['Make the client see it and agree before paying', 'Where they pay, in the same words, with a box they tick.'],
      ['Test it by booking yourself', 'On your own phone, as a client would, with a real card.'],
    ],
    note: 'The rule comes first and the software second.'
  },
  {
    key: 'holiday-schedule-for-salons', name: 'plan-night', type: 'checklist', label: 'Running the week',
    title: 'Plan your holiday schedule',
    alt: 'A checklist for planning a holiday schedule: close the days first, add a few long days with a limit, give regulars first pick, set the hours on the calendar, post the holiday hours everywhere, and protect the week after.',
    items: [
      ['Close the days first', 'Mark them closed on your booking calendar, today.'],
      ['Then add the long days, and only a few', 'Set a limit before you open them.'],
      ['Give your regulars first pick', 'Send them the dates a week before you post them publicly.'],
      ['Set the hours on your calendar, not in your head', 'Decide once, and let the calendar say no.'],
      ['Post the holiday hours everywhere, once', 'Keep it to dates and times.'],
      ['Protect the week after', 'Block a few days of it now, at the same time as your closed days.'],
    ],
    note: 'Every extra hour you work in December comes out of you in January.'
  },
  {
      key: 'appointment-reminder-card-template', name: 'card-night', type: 'policy', label: 'Getting them back',
      title: 'What goes on the card',
      alt: 'The wording for an appointment reminder card: the date and time, the service, how to change it, the policy in one line, and your booking link.',
      lines: [
        'Your next appointment: [Day], [Date] at [Time]',
        '[Service] with [Your name], about [length]',
        'To change it: [your booking link or number], at least [24] hours ahead',
        'Inside [24] hours, or a no-show, is [50%] of the service price',
        'Book anything else: [your booking link], or scan the code',
      ],
      note: 'Print the fixed parts, write the rest by hand.'
    },
  {
    key: 'refund-policy-for-salon', name: 'policy-night', type: 'policy', label: 'Money on the table',
    title: 'A salon refund policy, in six lines',
    alt: 'A six line salon refund policy: a window to tell you, a free fix, a refund when it cannot be fixed, deposits, products and gift cards.',
    lines: [
      'Not happy with your service? Message me within 7 days of your appointment.',
      'Come back and I will fix it at no charge.',
      'If it cannot be fixed, I will refund part or all of the service.',
      'Deposits follow my cancellation policy.',
      'Unopened products can be returned within 14 days.',
      'Gift cards are not exchanged for cash, unless the law requires it.',
    ],
    note: 'The wording that works is short and starts with the promise, not the restriction.'
  },
  {
    key: 'first-90-days-going-independent', name: 'months-night', type: 'steps', label: 'Going solo',
    title: 'Your first 90 days, month by month',
    alt: 'The first ninety days of going independent in four steps: before day one, sort out what is yours; month one, book the clients you have; month two, fill the gaps; month three, look at the numbers and fix one thing.',
    steps: [
      ['Before day one: sort out what is yours', 'Read your current agreement. Talk to an accountant once, early.'],
      ['Month one: book the clients you have', 'Message every client on your list personally.'],
      ['Month two: fill the gaps', 'The single strongest move is rebooking in the chair.'],
      ['Month three: look at the numbers and fix one thing', 'Pick the worst one and fix only that.'],
    ],
    note: 'You cannot tell what worked if you changed five things at once.'
  },
  {
    key: 'taking-time-off', name: 'week-off-night', type: 'checklist', label: 'Running the week',
    title: 'How to take a week off without losing clients',
    alt: 'A checklist for taking a week off without losing clients: pick the week early, close the dates before anyone books them, move anyone already booked, tell your regulars with a date they can book, set the out-of-office, and book your return week before you go.',
    items: [
      ['Pick the week early', 'Six to eight weeks ahead is a comfortable lead for most books.'],
      ['Close the dates before anyone books them', 'Include the edges.'],
      ['Move anyone already booked, personally', 'By name, with two specific alternatives.'],
      ['Tell your regulars, with a date they can book', 'Give them somewhere to land.'],
      ['Set the out-of-office', 'When you are back, and how to book in the meantime.'],
      ['Book your return week before you go', 'Fill it before you leave.'],
    ],
    note: 'A week away now costs less than the month you lose to an injury later.'
  },
  {
      key: 'client-notes-after-appointment', name: 'five-night', type: 'checklist', label: 'Getting them back',
      title: 'The five lines every note needs',
      alt: 'A checklist of the five lines in a client note: what you did, how it turned out, what they said, what to suggest next time, and the rebooking gap.',
      items: [
        ['What you did, so you could do it again', 'Write it as a recipe, not a description.'],
        ['How it turned out', 'One honest line.'],
        ['What they said about their week', 'So the first thing you say next time is a question about their life.'],
        ['What to suggest next time', 'If you write it down, you will actually say it.'],
        ['The rebooking gap', 'How many weeks until they should be back, and whether they booked it.'],
      ],
      note: 'Keep health information to what changes the service, and never share it.'
    },
  {
    key: 'how-to-price-nails-as-a-beginner', name: 'sum-night', type: 'steps', label: 'Money on the table',
    title: 'The pricing sum, worked through',
    alt: 'The pricing sum in six steps: product, fixed costs per hour, what you need to earn, your real time, the sum itself, and when to raise.',
    steps: [
      ['Add up the product for one service', 'Say $4 for a gel manicure.'],
      ['Turn your fixed costs into an hour', 'Say $800 a month. If you do 100 client hours a month, that is $8 an hour.'],
      ['Pick what you need to earn an hour', 'Not what you hope for, what you need. Say $30 an hour.'],
      ['Time yourself honestly', 'Say a gel manicure takes you 90 minutes right now.'],
      ['Do the sum', '$30 plus $8 is $38 an hour. For 1.5 hours that is $57, plus $4 of product, so $61.'],
      ['Raise it as you get faster and your book fills'],
    ],
    note: 'A worked example with round numbers. Put your own in.'
  },
  {
    key: 'booking-time-slot-intervals', name: 'interval-night', type: 'compare', label: 'Running the week',
    title: 'Where a booking is allowed to begin',
    alt: 'A comparison of a 15 minute interval and a 30 minute interval: what each suits, what it does to the day, the gaps it leaves, and what it costs.',
    cols: ['15 minute interval', '30 minute interval'],
    rows: [
      ['Suits', 'Menus with uneven lengths', 'Services that divide into the step'],
      ['A 45 minute cut', 'The next client can start at 9:45', 'Fifteen minutes sit empty after every cut'],
      ['The day', 'The day packs tight', 'Keeps the calendar readable'],
      ['The gaps', 'Twenty minutes here and thirty there', 'At least the same size'],
      ['The cost', 'Clients can start in places you would not have chosen', 'Strands time when a service does not divide evenly'],
    ],
    note: 'Pick the step that your most common service length divides into cleanly.'
  },
  {
      key: 'google-reviews-for-hair-salon', name: 'rules-night', type: 'dodont', label: 'Getting them back',
      title: 'Google reviews, done by the rules',
      alt: 'Two lists of Google’s rules for reviews: what to do, such as asking every client the same way and answering every review, and what never to do, such as offering incentives or asking how they felt first.',
      doLabel: 'What to do',
      do: [
        'Get your own review link from your Google Business Profile',
        'Ask every client, the same way',
        'Send the link while they are still standing there',
        'Answer every review, the good ones too',
      ],
      noLabel: 'What not to do',
      no: [
        'No incentives, not even for an honest one',
        'No filtering by asking how they felt first',
        'No writing reviews for anyone',
        'No buying them, from anyone, in any form',
      ]
    },
  {
    key: 'tell-clients-you-are-moving', name: 'announce-night', type: 'dodont', label: 'Going solo',
    title: 'How to tell clients you are leaving a salon',
    alt: 'Two panels: what to do when you tell clients you are leaving a salon, from reading your agreement first to finishing your last appointments well, and what not to do, from posting months ahead to complaining about the old salon.',
    doLabel: 'Do',
    do: [
      'Read your agreement before you message anyone',
      'Tell the owner before any client',
      'Message clients personally, with a date and a link',
      'Speak well of the place you are leaving',
      'Finish your last appointments as well as your first',
    ],
    noLabel: 'Do not',
    no: [
      'Post the news publicly months ahead',
      'Take a client list you are not clearly entitled to',
      'Contact clients in a way your agreement rules out',
      'Cut your prices to pull people across',
      'Complain about the old salon, to clients or online',
    ]
  },
  {
      key: 'square-appointments-pricing', name: 'addup-night', type: 'checklist', label: 'Switching',
      title: 'What to add up before you pick a plan',
      alt: 'A checklist of what to add up before you pick a Square Appointments plan: the plan, the processing on every payment, your staff count, hardware, deposits and the cost of leaving.',
      items: [
        ['The monthly plan, per location', 'Price it for the team you expect a year from now, not today’s.'],
        ['Processing on every payment', 'Take last month’s card takings and apply the processing rate to it.'],
        ['Staff count', 'The free plan has limits on staff and on what it covers.'],
        ['Hardware', 'If you want clients to tap a card at the counter, you buy a reader.'],
        ['Deposits and no-show fees', 'Each one is a card payment, so each one carries processing too.'],
        ['The cost of leaving', 'Saved cards stay with Square, and so does your sales history.'],
      ],
      note: 'The cheapest plan name is rarely the cheapest month.',
    },
    {
      key: 'salon-gift-cards', name: 'setup-night', type: 'steps', label: 'Money on the table',
      title: 'Gift cards before December fills',
      alt: 'Five steps to set up gift cards before the holidays: turn them on early, offer three amounts that match real services, decide on expiry first, put the link where gift buyers look, and tell regulars in person.',
      steps: [
        ['Turn on online gift cards', 'Before December, not the week before Christmas.'],
        ['Offer three amounts', 'Each one should match something real on your menu.'],
        ['Decide on expiry before you sell one', 'No expiry is the simplest choice.'],
        ['Put the link where gift buyers already are', 'The top of your booking site and your Instagram bio.'],
        ['Tell your regulars in person', 'Mention it at every December appointment.'],
      ],
      note: 'The money arrives now and the appointments land in January.',
    },
    {
      key: 'how-to-take-pictures-of-nails', name: 'steps-night', type: 'steps', label: 'Your own site',
      title: 'A nail photo that books clients',
      alt: 'Six steps to take a nail photo that books clients: shoot by a window, use a plain background, pick three poses, use the main lens and tap to focus, keep the true color, and name the service in the caption.',
      steps: [
        ['Shoot by a window', 'Face the hand toward the window so the light falls across the nails.'],
        ['Use a plain background', 'Pick one and keep it, the same every time.'],
        ['Three hand poses', 'Fingers together flat, the soft curl, and the thumb.'],
        ['Main lens, tap to focus', 'Move the phone closer instead of zooming.'],
        ['Keep the true color', 'Crop and brighten, but leave the polish alone.'],
        ['Name the service', 'Use the name from your price list in the caption.'],
      ],
      note: 'Light is most of it. Daylight from a window is free.',
    },
    {
      key: 'barber-kit-for-beginners', name: 'kit-night', type: 'checklist', label: 'Going solo',
      title: 'The barber kit to buy first',
      alt: 'A checklist of the barber kit to buy first: a clipper, a trimmer, guards, shears and combs, a razor with single-use blades, capes and neck strips, and disinfectant and cleaning.',
      items: [
        ['Clipper with an adjustable taper lever', 'Your main tool and the one to spend on.'],
        ['Trimmer', 'For line-ups, edges, beards and detail work.'],
        ['A full set of guards', 'Including the half sizes, because a fade lives in the gaps.'],
        ['Shears and combs', 'Straight shears, a cutting comb and a wide-tooth comb.'],
        ['Straight razor with single-use blades', 'A fresh blade for every client.'],
        ['Capes and neck strips', 'A fresh strip for every client.'],
        ['Disinfectant and cleaning', 'What your state board requires, plus clipper oil.'],
      ],
      note: 'Spend on the two tools in your hand all day and keep the rest simple.',
    },
    {
      key: 'nail-tech-supply-list', name: 'first-night', type: 'checklist', label: 'Going solo',
      title: 'Nail supplies to buy first',
      alt: 'A checklist of the nail supplies to buy first: sanitation, prep tools, one product system, a lamp that cures it, finishing products, and a station with light and ventilation.',
      items: [
        ['Sanitation', 'What your state board requires, and fresh files for every client.'],
        ['Prep tools', 'Pusher, nippers, files, buffers, dehydrator and primer.'],
        ['One product system', 'Gel polish, builder gel or acrylic, from one brand line.'],
        ['A lamp that cures it', 'Matched to what your gel’s maker recommends.'],
        ['Finishing', 'Top coat from the same line, cuticle oil, hand lotion.'],
        ['Your station', 'A stable table, a good task light and ventilation.'],
      ],
      note: 'Buy one system, learn it well, and add to it once clients are paying.',
    },
    {
      key: 'builder-gel-vs-gel-x', name: 'fit-night', type: 'compare', label: 'Money on the table',
      title: 'Builder gel or Gel-X',
      alt: 'A comparison of builder gel and Gel-X: what each does, how much length it gives, who it suits best, and what happens at the next appointment.',
      cols: ['Builder gel', 'Gel-X'],
      rows: [
        ['What it does', 'Strengthens and shapes the natural nail', 'Adds a full-cover soft gel tip'],
        ['Length', 'The client’s own, or a little with forms', 'Full length in one visit'],
        ['Best for', 'Weak or bendy nails, growing nails out', 'Clients who want length now'],
        ['Next appointment', 'Often rebalanced, depending on the product', 'Usually removed and replaced'],
      ],
      note: 'List each under the name clients search, with its own time and price.',
    },
];
