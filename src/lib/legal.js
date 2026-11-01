/**
 * Legal copy for the public /privacy and /terms pages.
 *
 * Everything here describes what this build actually does rather than what a launch
 * version might, because a policy that promises infrastructure which does not exist is
 * worse than no policy at all. Sections that depend on decisions still to be made say so
 * plainly. This is a working draft and needs a lawyer's review before any public launch.
 */

export const PRIVACY = {
  path: '/privacy',
  title: 'Privacy Policy',
  eyebrow: 'Legal',
  updated: '31 October 2026',
  intro:
    'Togetherly is a private space for exactly two people. This policy says what the app holds about you and your relationship, what it does not hold, and what changes when accounts move from this preview onto real infrastructure.',
  sections: [
    {
      heading: 'What Togetherly is not',
      body: [
        'Togetherly has no feed, no follower counts, no public profiles and no discovery. Nobody can browse to your space, and there is nowhere for a stranger to find you. There are no advertisements, and the product is not built to keep you scrolling.',
        'The only two people who can read a Togetherly space are the two people it belongs to.',
      ],
    },
    {
      heading: 'What this preview stores',
      body: [
        'You are looking at Stage 1: a working interface running entirely inside your browser. There is no Togetherly server behind it.',
      ],
      bullets: [
        'The couple, updates, moods, reactions and notifications on screen are sample data shipped with the build. They are not real people.',
        'Signing in writes one record to this browser\u2019s localStorage so the app can keep you logged in while you look around. It holds a session marker and the email address you typed.',
        'Anything you post here exists only in this tab. Reloading from scratch, or clearing site data, removes it.',
        'No analytics, no error-reporting services and no advertising trackers run on these pages. There are no cookies beyond the localStorage entry above.',
      ],
    },
    {
      heading: 'What we hold once real accounts exist',
      body: ['When sign-up is connected to a backend, a Togetherly account will hold:'],
      bullets: [
        'Your email address and the credentials needed to sign you in.',
        'The profile details you fill in: display name, nickname, city, and the two dates behind your counters \u2014 your anniversary and your next meeting.',
        'Every update you and your partner publish: the photograph, the mood you chose, the message you wrote, and when it was posted.',
        'Which reactions either of you tapped, and the notifications those generated.',
        'The invitation code that linked the two of you, and its expiry.',
      ],
    },
    {
      heading: 'What we do not do with that',
      bullets: [
        'We do not sell your data, and we do not share it with advertisers or data brokers.',
        'We do not run third-party AI on your content. The weekly recap shown in Settings is switched off for everyone and is not connected to any model in this version.',
        'We do not use your photographs or messages to train a model, now or under a later change of mind.',
        'We do not give anyone outside your space read access. Photos are held in private storage, not behind a public URL you would have to keep secret yourself.',
      ],
    },
    {
      heading: 'Where your data will live',
      body: [
        'The planned backend is Supabase \u2014 PostgreSQL for the records, Storage for the photographs, and Realtime for the moment your partner posts. Row-level security is the mechanism that enforces the two-person rule at the database rather than in the interface.',
        'The hosting region is not decided yet. It will be named on this page before any real account is created, because it determines which privacy regime your data sits under.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'Togetherly is not directed at anyone under eighteen. It asks for a photograph and a set of feelings about a romantic partnership, and that is not something we should be offering to children.',
      ],
    },
    {
      heading: 'Your rights, and where they stand today',
      body: [
        'In a finished product you would expect to export everything you have written and to delete your account outright. Both are real work still to be done, and the app tells you so rather than pretending:',
      ],
      bullets: [
        'Settings \u2192 Your space \u2192 Delete my space signs you out and clears the local session. It does not delete a server-side account, because this preview does not have one.',
        'Settings \u2192 Privacy \u2192 Download my data is present but disabled. An export endpoint is a pre-launch requirement, not a nice-to-have.',
      ],
    },
    {
      heading: 'Contact',
      body: [
        'There is no support address yet. A contact route for privacy questions is listed as a pre-launch task, and this section will name it. Until then there is nobody to write to, which is its own kind of honest answer about how early this build is.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'When the backend lands, this page changes substantially and the date at the top moves with it. Material changes to how data is handled will be announced inside the space to both partners, not left for you to notice here.',
      ],
    },
  ],
}

export const TERMS = {
  path: '/terms',
  title: 'Terms of Service',
  eyebrow: 'Legal',
  updated: '31 October 2026',
  intro:
    'These terms cover a preview. If you are reading them because you want to know what you are agreeing to before launching Togetherly publicly, the short answer is that the sections flagged below still need to be written.',
  sections: [
    {
      heading: 'The service',
      body: [
        'Togetherly gives one couple one private space, where each person can post a daily update of a photograph, a mood and a line of text, and the other can react to it.',
        'This is version 0.1. It runs on sample data, has no accounts, and no part of it is guaranteed to stay as it is.',
      ],
    },
    {
      heading: 'Your space and your partner',
      body: [
        'A space holds exactly two people. You create an invitation code, your partner enters it, and the two timelines merge.',
        'Either person can unlink at any time, from Connect or from Settings. Unlinking hides the shared timeline from both accounts; it does not erase what either of you wrote, and re-linking with a fresh code brings it back. That is deliberate \u2014 ending the connection should not quietly destroy a year of memories.',
      ],
    },
    {
      heading: 'Who owns what you post',
      body: [
        'You do. Everything you write and every photograph you upload stays yours.',
        'The only licence you grant Togetherly is the narrow one needed to do the job: storing your update and showing it to your partner. We do not take a licence to publish it, promote us with it, or feed it into a model.',
      ],
    },
    {
      heading: 'What you agree to',
      bullets: [
        'Post photographs you have the right to post, and not someone else\u2019s private images without their say.',
        'Use your own account. Sharing sign-in details with anyone other than your linked partner breaks the one-space-two-people rule the product is built around.',
        'No scraping, no automated posting, no reverse-engineering the service to reach somebody else\u2019s space.',
        'Do not use it to contact, monitor or pressure someone who does not want to be contacted.',
      ],
    },
    {
      heading: 'No warranty, while this is a preview',
      body: [
        'The app is offered as it is. There is no uptime commitment, no support SLA, and no promise that anything \u2014 including the data in front of you \u2014 will survive the next change.',
        'Please do not treat this build as the only copy of the things you put into it. That is a real risk in a preview, and it is the reason the export button exists in Settings even though it does not work yet.',
      ],
    },
    {
      heading: 'Ending your use',
      body: [
        'Delete your space from Settings \u2192 Your space at any time, for any reason. Once real accounts exist, deletion will remove your account and the updates you wrote; your partner keeps their own and loses sight of the shared timeline.',
      ],
    },
    {
      heading: 'Still to be written before launch',
      body: [
        'A paid tier and its refund terms. The governing law and dispute venue, which depend on where the service is hosted and where the first users are. A notice-and-takedown route for content either partner objects to. Rate and storage limits once the backend exists.',
        'These are listed here so that nobody mistakes the gaps for silence.',
      ],
    },
    {
      heading: 'Changes to these terms',
      body: [
        'Continuing to use the app after a change means accepting it. Substantive changes \u2014 anything that narrows a right or expands what we may do with your content \u2014 will be shown to both people in the space, not only on this page.',
      ],
    },
  ],
}
