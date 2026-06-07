/** Google AdSense publisher ID for umunsi.com */
export const ADSENSE_CLIENT = 'ca-pub-3584259871242471';

export const ADSENSE_SLOTS = {
  articleBeforeContent: '8081945273',
  articleAfterParagraph3: '6489436663',
  articleAfterParagraph5: '6849820312',
  articleAfterParagraph7: '6385720225',
  articleSidebar: '9267546505',
  homeAfterParagraph7: '1353027611',
  homeAfterContent: '5829562310',
  categoryLeaderboard: '5829562310',
  categorySidebar: '9267546505',
} as const;

export type AdSenseSlotId = (typeof ADSENSE_SLOTS)[keyof typeof ADSENSE_SLOTS];
