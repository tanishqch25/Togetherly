/**
 * Stage 1 mock data. Every screen reads from here through AppContext, so Stage 3
 * swaps in Supabase queries without touching component code.
 */

export const ME = 'user-me'
export const PARTNER = 'user-partner'

function daysAgo(days, hours = 0, minutes = 0) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function daysFromNow(days, hours = 0, minutes = 0) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export const couple = {
  id: 'couple-01',
  anniversary: '2023-02-14T00:00:00.000Z',
  nextMeeting: daysFromNow(34, 14, 25),
  timezoneLabel: 'EST ↔ GMT',
  partners: [
    {
      id: ME,
      name: 'Emerson',
      nickname: 'Emmy',
      city: 'Toronto, Canada',
      avatarUrl: null,
      initials: 'E',
    },
    {
      id: PARTNER,
      name: 'Sparkles',
      nickname: 'Sparky',
      city: 'Manchester, UK',
      avatarUrl: null,
      initials: 'S',
    },
  ],
}

export function partnerOf(userId) {
  return couple.partners.find((p) => p.id !== userId) ?? couple.partners[1]
}

/**
 * Newest first. `photo` points at a local asset in /public/mocks; Stage 3 replaces
 * these with Supabase Storage URLs.
 */
export const seedUpdates = [
  {
    id: 'upd-01',
    authorId: PARTNER,
    moodId: 'missing_you',
    message:
      'Rained the whole walk home and all I wanted was your terrible playlist and your company. Counting the days.',
    photo: '/mocks/update-rainywindow.png',
    createdAt: daysAgo(0, 8, 42),
    reactions: { heart: [ME], miss: [ME] },
  },
  {
    id: 'upd-02',
    authorId: ME,
    moodId: 'excited',
    message: 'Board finally approved my leave for December. We have real dates now, not maybe ones.',
    photo: null,
    createdAt: daysAgo(0, 7, 15),
    reactions: { heart: [PARTNER], sparkle: [PARTNER], proud: [PARTNER] },
  },
  {
    id: 'upd-03',
    authorId: PARTNER,
    moodId: 'happy',
    message: 'Golden hour on the cliff path. Read your letter twice before I sat down.',
    photo: '/mocks/update-goldenhour.png',
    createdAt: daysAgo(1, 19, 5),
    reactions: { heart: [ME], sparkle: [ME] },
  },
  {
    id: 'upd-04',
    authorId: ME,
    moodId: 'peaceful',
    message: 'Quiet Sunday. Made the coffee the way you showed me and it almost tasted right.',
    photo: '/mocks/update-cafe.png',
    createdAt: daysAgo(2, 11, 30),
    reactions: { heart: [PARTNER] },
  },
  {
    id: 'upd-05',
    authorId: PARTNER,
    moodId: 'tired',
    message: 'Third deadline this week. Falling asleep mid-sentence but did not want to skip tonight.',
    photo: null,
    createdAt: daysAgo(3, 23, 10),
    reactions: { heart: [ME], miss: [ME] },
  },
  {
    id: 'upd-06',
    authorId: ME,
    moodId: 'loved',
    message: 'You sent me a photo of your desk at 4am just so I would know you were working. Cheapest data, best gift.',
    photo: null,
    createdAt: daysAgo(4, 21, 45),
    reactions: { heart: [PARTNER], sparkle: [PARTNER] },
  },
  {
    id: 'upd-07',
    authorId: PARTNER,
    moodId: 'happy',
    message: 'Market morning. Peaches were too good not to photograph for you.',
    photo: '/mocks/update-picnic.png',
    createdAt: daysAgo(6, 10, 20),
    reactions: { heart: [ME], laugh: [ME] },
  },
  {
    id: 'upd-08',
    authorId: ME,
    moodId: 'stressed',
    message: 'Brutal week. Your 1am voice note fixed more than I can honestly explain.',
    photo: null,
    createdAt: daysAgo(8, 22, 5),
    reactions: { heart: [PARTNER], proud: [PARTNER] },
  },
  {
    id: 'upd-09',
    authorId: PARTNER,
    moodId: 'peaceful',
    message: 'Lighthouse trip. Wind so strong it held me up. Wish you had been there to hold me up too.',
    photo: '/mocks/update-goldenhour.png',
    createdAt: daysAgo(12, 17, 40),
    reactions: { heart: [ME], miss: [ME] },
  },
  {
    id: 'upd-10',
    authorId: ME,
    moodId: 'missing_you',
    message: 'Found the scarf you left here. It still smells like your shampoo. Not returning it.',
    photo: null,
    createdAt: daysAgo(16, 20, 15),
    reactions: { heart: [PARTNER], sparkle: [PARTNER], miss: [PARTNER] },
  },
  {
    id: 'upd-11',
    authorId: PARTNER,
    moodId: 'excited',
    message: 'Booked the train for February without telling you. You will have to wait and see.',
    photo: null,
    createdAt: daysAgo(21, 9, 55),
    reactions: { heart: [ME], sparkle: [ME], laugh: [ME] },
  },
  {
    id: 'upd-12',
    authorId: ME,
    moodId: 'happy',
    message: 'First garden table of the season. Saved you the chair facing east.',
    photo: '/mocks/update-cafe.png',
    createdAt: daysAgo(26, 18, 30),
    reactions: { heart: [PARTNER] },
  },
  {
    id: 'upd-13',
    authorId: PARTNER,
    moodId: 'sad',
    message: 'Your birthday and I am eight time zones away. This one stings more than I expected.',
    photo: null,
    createdAt: daysAgo(34, 23, 59),
    reactions: { heart: [ME], miss: [ME], sparkle: [ME] },
  },
  {
    id: 'upd-14',
    authorId: ME,
    moodId: 'loved',
    message: 'Three years. Same argument about the window fan, same promise to fix it.',
    photo: '/mocks/update-picnic.png',
    createdAt: daysAgo(41, 12, 0),
    reactions: { heart: [PARTNER], sparkle: [PARTNER] },
  },
  {
    id: 'upd-15',
    authorId: PARTNER,
    moodId: 'happy',
    message: 'Rooftop with the gang, but I kept checking my phone for your goodnight.',
    photo: '/mocks/update-rainywindow.png',
    createdAt: daysAgo(58, 21, 25),
    reactions: { heart: [ME], laugh: [ME] },
  },
  {
    id: 'upd-16',
    authorId: ME,
    moodId: 'peaceful',
    message: 'Sea was flat this morning. Walked the whole promenade thinking about nothing in particular.',
    photo: null,
    createdAt: daysAgo(72, 7, 45),
    reactions: { heart: [PARTNER] },
  },
]

export const invitation = {
  code: 'TLSH-4827',
  expiresAt: daysFromNow(7),
  status: 'pending',
}

/**
 * Newest first. `updateId` is the deep link target, so every row opens the moment it
 * came from. Stage 3 writes these on the server instead of seeding them here.
 */
export const seedNotifications = [
  {
    id: 'ntf-01',
    kind: 'reaction',
    actorId: PARTNER,
    updateId: 'upd-02',
    reactionId: 'proud',
    createdAt: daysAgo(0, 9, 5),
    read: false,
  },
  {
    id: 'ntf-02',
    kind: 'checkin',
    actorId: PARTNER,
    updateId: 'upd-01',
    createdAt: daysAgo(0, 8, 42),
    read: false,
  },
  {
    id: 'ntf-03',
    kind: 'milestone',
    actorId: null,
    updateId: null,
    title: '34 days until you see Sparkles',
    body: 'Your countdown crossed a month. February is real now.',
    createdAt: daysAgo(1, 20, 12),
    read: false,
  },
  {
    id: 'ntf-04',
    kind: 'reaction',
    actorId: PARTNER,
    updateId: 'upd-12',
    reactionId: 'heart',
    createdAt: daysAgo(3, 6, 40),
    read: true,
  },
  {
    id: 'ntf-05',
    kind: 'checkin',
    actorId: PARTNER,
    updateId: 'upd-03',
    createdAt: daysAgo(1, 19, 5),
    read: true,
  },
  {
    id: 'ntf-06',
    kind: 'connection',
    actorId: null,
    updateId: null,
    title: 'Your invite code is still live',
    body: 'TLSH-4827 expires in seven days.',
    createdAt: daysAgo(5, 12, 0),
    read: true,
  },
]
