import {
  KargoojariEntry,
  MosqueRecord,
  SathiCategory,
  SathiEntry,
} from '../types/directory';
import { formatBdPhone } from '../utils/bengali';

function entries(
  mosqueId: number,
  cat: SathiCategory,
  items: Array<[string, string?]>
): SathiEntry[] {
  return items.map(([name, phone = ''], idx) => ({
    id: `m${mosqueId}-${cat}-${idx + 1}`,
    name,
    phone: formatBdPhone(phone),
    address: '',
    notes: '',
  }));
}

const RAW_INITIAL_MOSQUES: MosqueRecord[] = [
  {
    id: 1,
    name: 'ওয়ায়েজ করনী জামে মসজিদ',
    address: '',
    khatib: { name: 'মুফতী তাজুল ইসলাম সাহেব', phone: '01718-416062' },
    imam: { name: 'মাও: মামুন সাহেব', phone: '01916-146774' },
    muazzin: { name: 'জনাব মোঃ টিপু সুলতান', phone: '01660-109228' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(1, SathiCategory.SalwaliUlama, [
        ['মুফতী সাআদ বিন এনাম', '01967-366704'],
        ['মুফতী জোবায়ের আহমেদ', '01803-168732'],
        ['মুফতী রাকিবুল ইসলাম', '01631-224170'],
        ['মুফতী হিশামুল হক', '01942-794185'],
        ['মুফতী ওমায়ের', '01845-242840'],
        ['মুফতী জোবায়ের হোসেন'],
      ]),
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(1, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ সাজেদুল হক (টিপু)'],
        ['ভাই মোঃ সাজ্জাদুল হক (বিপ্লব)'],
        ['ভাই মোঃ নোয়াব আলি'],
        ['ভাই মোঃ হাকিম বিশ্বাস'],
        ['ভাই মোঃ সুমন শেখ'],
        ['ভাই মোঃ হাবিব'],
        ['ভাই মোঃ নিজাম'],
        ['ভাই মোঃ জাহাঙ্গির ইঞ্জিনিয়ারিং'],
        ['ভাই মোঃ জাহাঙ্গির লস্কর'],
        ['ভাই মোঃ নুর মোহাম্মদ'],
        ['ভাই মোঃ আবু রায়হান'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(1, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ দেলোয়ার হোসেন'],
        ['ভাই মোঃ ইসমাইল'],
        ['ভাই মোঃ নাসির উদ্দিন'],
        ['ভাই মোঃ মিজান'],
        ['ভাই মোঃ শাহীন'],
        ['ভাই মোঃ এনামুল হাসান'],
        ['ভাই মোঃ আলমগীর'],
        ['ভাই মোঃ সিরাজ'],
        ['ভাই মোঃ আদিল'],
        ['ভাই মোঃ আব্দুল মালেক'],
        ['ভাই মোঃ ইসমাইল ইসান'],
        ['ভাই মোঃ হারিস'],
        ['ভাই মোঃ শাহাজউদ্দিন'],
        ['ভাই মোঃ ইয়াহিয়া'],
        ['ভাই মোঃ ইয়াসিন'],
        ['ভাই মোঃ কাদির'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: entries(
        1,
        SathiCategory.MasturatTenFifteenDays,
        [
          ['ভাই মোঃ সাজেদুল হক (টিপু)'],
          ['ভাই মোঃ সাজ্জাদুল হক (বিপ্লব)'],
          ['ভাই মোঃ দেলোয়ার হোসেন'],
          ['ভাই মোঃ নাসির উদ্দিন'],
          ['ভাই মোঃ এনামুল হাসান (আপেল)'],
        ]
      ),
      [SathiCategory.MasturatThreeDays]: entries(
        1,
        SathiCategory.MasturatThreeDays,
        [
          ['মুফতী সাদ উদ্দিন'],
          ['মুফতী হিশাম'],
          ['মুফতী ওমায়ের'],
          ['মুফতী জোবায়ের আহমেদ'],
          ['মুফতী সিরাজ'],
          ['মুফতী ইসমাইল'],
          ['মুফতী নোয়াব আলী'],
          ['মুফতী সুমন শেখ'],
          ['ভাই মোঃ আদিল'],
          ['ভাই মোঃ নিজাম'],
          ['ভাই মোঃ শাইজ উদ্দিন খন্দকার'],
        ]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 2,
    name: 'বায়তুল আমান জামে মসজিদ',
    address: '',
    khatib: { name: 'মাও: ইসমাইল', phone: '01711-079853' },
    imam: { name: '', phone: '' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: [],
      [SathiCategory.ThreeChillaUlama]: entries(2, SathiCategory.ThreeChillaUlama, [
        ['মাও: আব্দুস সালাম', '01910-125473'],
      ]),
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: entries(2, SathiCategory.Bidesh, [
        ['ভাই মোঃ গিয়াসউদ্দীন খাঁন', '01670-130488'],
      ]),
      [SathiCategory.ThreeChillaSathi]: entries(2, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ লুৎফর রহমান', '01830-295424'],
        ['ভাই মোঃ গোলাম হোসেন', '01893-016742'],
        ['ভাই মোঃ সুমন মাষ্টার', '01786-673268'],
        ['ভাই মোঃ আশরাফুল ইসলাম', '01844-020851'],
        ['ভাই মোঃ মোখলেছুর রহমান', '01776-897315'],
        ['ভাই মোঃ জিয়াউর রহমান', '01713-277877'],
        ['ভাই মোঃ হাবিব উল্লাহ', '01533-562424'],
        ['ভাই মোঃ আব্দুল মালেক', '01723-294229'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(2, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ ইলিয়াছ খাঁন', '01711-203833'],
        ['ভাই মোঃ আবু আলম', '01715-102495'],
        ['ভাই মোঃ একে আজাদ', '01915-021852'],
        ['ভাই মোঃ তারেকুল ইসলাম', '01720-209244'],
        ['ভাই মোঃ আজিজুর রহমান', '01884-880147'],
        ['ভাই মোঃ মাও জুনায়েদ খান (২০ দিন)', '01822-870458'],
        ['ভাই মোঃ আলামিন', '01784-468140'],
        ['ভাই মোঃ আলী আহমেদ', '01943-900922'],
        ['ভাই মোঃ মোল্লা', '01313-511662'],
        ['ভাই মোঃ হা মাও ইসমাঈল', '01711-079853'],
        ['ভাই মোঃ মুজিবুর রহমান বেপারী', '01915-488128'],
        ['ভাই মোঃ আমিনুল ইসলাম', '01328-736045'],
      ]),
      [SathiCategory.MasturatChilla]: entries(2, SathiCategory.MasturatChilla, [
        ['ভাই মোঃ গিয়াসউদ্দীন খাঁন', '01670-130488'],
      ]),
      [SathiCategory.MasturatTenFifteenDays]: entries(
        2,
        SathiCategory.MasturatTenFifteenDays,
        [
          ['ভাই মোঃ আশরাফুল ইসলাম', '01677-482293'],
          ['ভাই মোঃ আবু আলম', '01715-102495'],
        ]
      ),
      [SathiCategory.MasturatThreeDays]: entries(
        2,
        SathiCategory.MasturatThreeDays,
        [
          ['ভাই মোঃ মোখলেছুর রহমান', '01776-897315'],
          ['ভাই মোঃ আলী আহমদ', '01943-900922'],
          ['ভাই মোঃ জিয়াউর রহমান', '01713-277877'],
          ['ভাই মোঃ ইব্রাহিম', '01816-034175'],
          ['ভাই মোঃ আজিজুর রহমান', '01884-880147'],
          ['ভাই মোঃ শরিফ উদ্দিন', '01722-335428'],
          ['ভাই মোঃ আল আমিন'],
          ['ভাই মোঃ গোলাম হোসেন', '01893-016742'],
          ['ভাই মোঃ মোল্লা', '01313-511662'],
        ]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 3,
    name: 'গিরিধারা কেন্দ্রীয় জামে মসজিদ',
    address: '',
    khatib: { name: '', phone: '' },
    imam: { name: '', phone: '' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(3, SathiCategory.SalwaliUlama, [
        ['মুফতী ইব্রাহীম সাহেব'],
      ]),
      [SathiCategory.ThreeChillaUlama]: entries(3, SathiCategory.ThreeChillaUlama, [
        ['মাও: হাবীবুর রহমান'],
      ]),
      [SathiCategory.OneChillaUlama]: entries(3, SathiCategory.OneChillaUlama, [
        ['মাও: সালমান'],
      ]),
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(3, SathiCategory.ThreeChillaSathi, [
        ['হাজী আলাউদ্দীন সাব'],
        ['ভাই মোঃ মোবারক'],
        ['ভাই মোঃ জাহিদ'],
        ['ডাঃ আশিক উল্লাহ'],
        ['ভাই মোঃ আঃ ওহাব'],
        ['ভাই মোঃ সালমান'],
        ['ভাই মোঃ আঃ কাইয়ুম'],
        ['ভাই মোঃ আবুল কাশেম'],
        ['ভাই মোঃ গিয়াসউদ্দিন গাজী'],
        ['ভাই মোঃ আসলাম'],
        ['ভাই মোঃ দ্বীন ইসলাম'],
        ['ভাই মোঃ সাইফুল ইসলাম'],
        ['ভাই মোঃ গিয়াসউদ্দিন'],
        ['ভাই মোঃ জাহিদ হোসেন রবিন'],
        ['ভাই মোঃ ইসহাক'],
        ['ডাঃ রাশেদুজ্জামান'],
        ['ভাই মোঃ মেরাজ'],
        ['ভাই মোঃ ইসমাইল'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(3, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ শফিক'],
        ['ভাই মোঃ রফিক'],
        ['ভাই মোঃ আরাফাত'],
        ['ভাই মোঃ শাহজাহান'],
        ['ভাই মোঃ মোফাজ্জল'],
        ['ভাই মোঃ মঈনুল ইসলাম'],
        ['ভাই মোঃ ইসমাইল'],
        ['ভাই মোঃ হুমায়ুন কবির'],
        ['ভাই মোঃ সরোয়ার'],
        ['ভাই মোঃ ইব্রাহীম'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: [],
      [SathiCategory.ChatraNowjowan]: entries(3, SathiCategory.ChatraNowjowan, [
        ['মোবারক হোসেন', '+880 1918-229603'],
        ['মোরসালিন পারভেজ', '+880 1567-963741'],
        ['ইয়াসিন আরাফাত রাফি', '+880 1575-663352'],
        ['আহমেদ ফয়সাল', '+880 1576-478264'],
        ['হাসানুর রহমান', '+880 1772-726045'],
      ]),
    },
  },
  {
    id: 4,
    name: 'ওমর বিন খাত্তাব রা: মসজিদ',
    address: '',
    khatib: { name: 'মুফতি নাজমুল হাসান', phone: '' },
    imam: { name: '', phone: '' },
    muazzin: { name: 'মোস্তফা কামাল', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: [],
      [SathiCategory.ThreeChillaUlama]: entries(4, SathiCategory.ThreeChillaUlama, [
        ['মুহাম্মাদুল্লাহ সাব্বির'],
      ]),
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(4, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ শহিদুল্লাহ'],
        ['ভাই মোঃ জাহাঙ্গীর আলম'],
        ['ভাই মোঃ আইয়ুব আলী'],
        ['ভাই মোঃ ইমরান'],
        ['ভাই মোঃ আবুল কাশেম'],
        ['ভাই মোঃ আঃ রহমান'],
        ['ভাই মোঃ আরাফাত'],
        ['ভাই মোঃ আব্দুর রশীদ'],
        ['ভাই মোঃ কামরুল জামান'],
        ['ভাই মোঃ শাকের'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(4, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ ওমর ফারুক'],
        ['ভাই মোঃ আবু সাঈদ'],
        ['ভাই মোঃ সৈয়দ আলী'],
        ['ভাই মোঃ আবু তালহা'],
        ['ভাই মোঃ ইয়াহিয়া'],
        ['ভাই মোঃ আসাদুল্লাহ'],
        ['ভাই মোঃ আবুবকর'],
      ]),
      [SathiCategory.MasturatChilla]: entries(4, SathiCategory.MasturatChilla, [
        ['উম্মে আরাফাত'],
        ['আহলিয়া নাজমুল'],
      ]),
      [SathiCategory.MasturatTenFifteenDays]: entries(
        4,
        SathiCategory.MasturatTenFifteenDays,
        [
          ['ভাই মোঃ আঃ রহমান'],
          ['ভাই মোঃ জাহাঙ্গীর আলম'],
          ['ভাই মোঃ আঃ রশীদ'],
          ['ভাই মোঃ জাকির হোসেন'],
          ['উম্মে সাদিকুল'],
        ]
      ),
      [SathiCategory.MasturatThreeDays]: [],
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 5,
    name: 'আশ্রাফিয়া মাদ্রাসা মসজিদ (আল আকসা)',
    address: '',
    khatib: { name: '', phone: '' },
    imam: { name: '', phone: '' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(5, SathiCategory.SalwaliUlama, [
        ['মাও: আব্দুর রশিদ'],
        ['মাও: শামসুল ইসলাম'],
      ]),
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: entries(5, SathiCategory.OneChillaUlama, [
        ['মুফতী শারীফ হোসাইন'],
        ['মুফতী মাফিজুল ইসলাম'],
        ['মুফতী কামালউদ্দিন'],
        ['মুফতী আঃ মতিন'],
      ]),
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(5, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ হোসেন', '01953-889002'],
        ['ভাই মোঃ আবুল কাশেম', '01962-351339'],
        ['ভাই মোঃ শহিদাত', '01817-517893'],
      ]),
      [SathiCategory.OneChillaSathi]: [],
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: [],
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 6,
    name: 'বায়তুশ শরীফ জামে মসজিদ',
    address: '',
    khatib: { name: 'খন্দকার মোঃ মুফতি কামাল উদ্দিন', phone: '01715-455529' },
    imam: { name: 'খন্দ: মুজিবুর রহমান', phone: '01814-868204' },
    muazzin: { name: 'হাফেজ আকবর রহমান', phone: '01704-828252' },
    categories: {
      [SathiCategory.SalwaliUlama]: [],
      [SathiCategory.ThreeChillaUlama]: entries(6, SathiCategory.ThreeChillaUlama, [
        ['হাফেজ মোঃ মুফতি কামাল উদ্দিন'],
      ]),
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(6, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ মুহাম্মদ আবুল হাসনাত খান', '01670-181294'],
        ['ভাই মোঃ আশরাফুল হোসেন', '01779-748389'],
        ['ভাই মোঃ আব্দুল আজিজ শেখ', '01783-293691'],
        ['ভাই মোঃ আনিসুর রহমান', '01743-906613'],
        ['ভাই মোঃ আক্তার হোসেন', '01986-100298'],
        ['ভাই মোঃ মশিউর রহমান', '01730-940540'],
        ['ডাঃ মোহাম্মদ দেলোয়ার হোসেন', '01854-681068'],
        ['ভাই মোঃ আব্দুস সামাদ'],
        ['ভাই মোঃ আনোয়ার হোসেন', '01956-100056'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(6, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ মাহাদি', '01623-507080'],
        ['ভাই মোঃ মোহাজির খান'],
        ['ভাই মোঃ জিহাদ', '01401-271710'],
        ['ভাই মোঃ ফেরদৌস কবির'],
      ]),
      [SathiCategory.MasturatChilla]: entries(6, SathiCategory.MasturatChilla, [
        ['ভাই মোঃ আক্তার হোসেন', '01986-100298'],
      ]),
      [SathiCategory.MasturatTenFifteenDays]: entries(
        6,
        SathiCategory.MasturatTenFifteenDays,
        [['ভাই মোঃ আশরাফুল হোসেন', '01779-748389']]
      ),
      [SathiCategory.MasturatThreeDays]: entries(
        6,
        SathiCategory.MasturatThreeDays,
        [['ভাই মোঃ ফারুক আহমেদ', '01913-174029']]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 7,
    name: 'বাইতুস সালাম জামে মসজিদ',
    address: '',
    khatib: { name: 'মোঃ সোলায়মান', phone: '01601-236236' },
    imam: { name: 'মোঃ কামাল উদ্দীন', phone: '01715-455529' },
    muazzin: { name: 'মোঃ আব্দুল্লাহ মিয়া', phone: '01760-730691' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(7, SathiCategory.SalwaliUlama, [
        ['মাও আহমেদ মুসা', '01700-691319'],
      ]),
      [SathiCategory.ThreeChillaUlama]: entries(7, SathiCategory.ThreeChillaUlama, [
        ['মোঃ সাইফ উদ্দীন', '01986-015912'],
      ]),
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: entries(7, SathiCategory.Bidesh, [
        ['ভাই মোঃ সাইফ উদ্দীন', '01986-015912'],
      ]),
      [SathiCategory.ThreeChillaSathi]: entries(7, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ আব্দুর রব শরিফ', '01795-812980'],
        ['ভাই মোঃ শাকিব মিয়া', '01875-944831'],
        ['ভাই মোঃ নুরুন নবী', '01819-055834'],
        ['ভাই মোঃ শাহনেওয়াজ', '01717-271495'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(7, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ আক্তার হোসেন', '01719-555882'],
      ]),
      [SathiCategory.MasturatChilla]: entries(7, SathiCategory.MasturatChilla, [
        ['ভাই মোঃ সাইফ উদ্দীন', '01986-015912'],
      ]),
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: entries(
        7,
        SathiCategory.MasturatThreeDays,
        [['ভাই মোঃ নুরুন নবী', '01819-055834']]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 8,
    name: 'কাউছার জামে মসজিদ',
    address: '',
    khatib: { name: 'মুফতি সাদ বিন এনাম', phone: '01967-366704' },
    imam: { name: 'মা: মো: রফিক', phone: '01818-197390' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(8, SathiCategory.SalwaliUlama, [
        ['মুফতি সাদ বিন এনাম', '01967-366704'],
      ]),
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: entries(8, SathiCategory.OneChillaUlama, [
        ['মাও: মো: শেখ ফরিদ', '01818-197390'],
      ]),
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(8, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ সবুজ', '01721-447575'],
        ['ভাই মোঃ কাউসার', '01878-246112'],
        ['ভাই মোঃ রাকিব', '01961-880050'],
        ['ভাই মোঃ জাহাঙ্গীর', '01981-955230'],
        ['ভাই মোঃ নাজমুল', '01670-802545'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(8, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ আল আমিন', '01994-975367'],
        ['ভাই মোঃ রিফাত', '01635-508216'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: entries(
        8,
        SathiCategory.MasturatTenFifteenDays,
        [['ভাই মোঃ নাজমুল', '01670-802545']]
      ),
      [SathiCategory.MasturatThreeDays]: entries(
        8,
        SathiCategory.MasturatThreeDays,
        [
          ['ভাই মোঃ সবুজ', '01721-447575'],
          ['ভাই মোঃ নাজমুল', '01670-802545'],
        ]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 9,
    name: 'তুষারধারা জামে মসজিদ',
    address: '',
    khatib: { name: 'মুফতি নাজমুল হাসান মাহফুজ', phone: '01912-357755' },
    imam: { name: 'মাও: মাহদি হাসান', phone: '01609-008939' },
    muazzin: { name: 'হাফেজ আবু সাঈদ', phone: '01642-603369' },
    categories: {
      [SathiCategory.SalwaliUlama]: [],
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(9, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ হুমায়ন কবির', '01474-779636'],
        ['ভাই মোঃ আকরাম হোসেন রিপন', '01996-160484'],
        ['ভাই মোঃ আবুবক্কর সিদ্দিক (সোহাগ)', '01615-001616'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(9, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ সজিব', '01893-786802'],
        ['ভাই মোঃ মহসিন মামুন', '01711-774049'],
        ['ভাই মোঃ রুহুল আমীন', '01630-419482'],
        ['ভাই মোঃ কান্তু মিয়া', '01701-470407'],
        ['ভাই মোঃ নাহিদ', '01990-994309'],
        ['ভাই মোঃ খোরশেদ মিয়া', '01948-436571'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: [],
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 10,
    name: 'আবুবকর জামে মসজিদ',
    address: '',
    khatib: { name: 'মোঃ মারুফ', phone: '01626-196454' },
    imam: { name: '', phone: '' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: [],
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(10, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ আব্দুল আউয়াল'],
        ['ভাই মোঃ হানিফ'],
        ['ভাই মোঃ মোরশেদ'],
        ['ভাই মোঃ জিয়াউর রহমান'],
        ['ভাই মোঃ আব্দুল কুদ্দুস'],
        ['ভাই মোঃ তৌহিদ'],
        ['ভাই মোঃ মামুন'],
        ['ভাই মোঃ আল আমিন'],
        ['ভাই মোঃ হেলাল উদ্দিন'],
      ]),
      [SathiCategory.OneChillaSathi]: [],
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: [],
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 11,
    name: 'বাইতুশ শরিযত জামে মসজিদ',
    address: '',
    khatib: { name: 'হাফেজ আবু জাফর আহম্মেদ', phone: '01732-515449' },
    imam: { name: '', phone: '' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(11, SathiCategory.SalwaliUlama, [
        ['হাফেজ মুফতি তামিম', '01765-336322'],
      ]),
      [SathiCategory.ThreeChillaUlama]: entries(11, SathiCategory.ThreeChillaUlama, [
        ['মাও: আব্দুস সালাম', '01910-125473'],
      ]),
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(11, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ আলী সরকার', '01911-309596'],
        ['ভাই মোঃ নাজমুল হাসান', '01826-658594'],
        ['ভাই মোঃ ওয়াহেদ'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(11, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ আবদুলাহ', '01885-554378'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: entries(
        11,
        SathiCategory.MasturatThreeDays,
        [['ভাই মোঃ আলী সরকার', '01911-309596']]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 12,
    name: 'তুষারধারা কবরস্থান জামে মসজিদ',
    address: '',
    khatib: { name: 'হা: মাও: জাহিদুল ইসলাম', phone: '01924-171870' },
    imam: { name: 'মুহা: ওসমান গনী', phone: '01611-431515' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(12, SathiCategory.SalwaliUlama, [
        ['হা: মাও: জাহিদুল ইসলাম', '01924-171870'],
      ]),
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(12, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ কাদের দেওয়ান', '01715-128085'],
        ['ভাই মোঃ আবুবক্কর সিদ্দিক', '01821-404990'],
        ['ভাই মোঃ মাহবুব বিন আঃ কাঃ দেওয়ান', '01515-606411'],
        ['ভাই মোঃ তানভির হোসেন মোশারফ', '01975-230714'],
        ['ভাই মোঃ আল আমিন', '01677-563781'],
        ['ভাই মোঃ মাসুদুল করিম মাসুম', '01608-114854'],
        ['ভাই মোঃ মারুফ হোসেন'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(12, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ আশিকুর রহমান', '01918-523972'],
        ['ভাই মোঃ নিজাম উদ্দিন শেখ', '01916-840013'],
        ['ভাই মোঃ শিহাব উদ্দিন শেখ', '01876-741476'],
        ['ভাই মোঃ কামাল হোসেন', '01711-997970'],
      ]),
      [SathiCategory.MasturatChilla]: entries(12, SathiCategory.MasturatChilla, [
        ['ভাই মোঃ আঃ কাদের দেওয়ান', '01715-128085'],
      ]),
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: entries(
        12,
        SathiCategory.MasturatThreeDays,
        [
          ['ভাই মোঃ মাহবুব বিন আঃ কাঃ দেওয়ান', '01515-606411'],
          ['ভাই মোঃ আল আমিন', '01677-563781'],
          ['ভাই মোঃ মারুফ হোসেন'],
          ['ভাই মোঃ মোসারফ হোসেন', '01719-367932'],
        ]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 13,
    name: 'জান্নাতুল নাঈম জামে মসজিদ',
    address: '',
    khatib: { name: 'মাও: মজিবর রহমান', phone: '' },
    imam: { name: '', phone: '' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: [],
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: [],
      [SathiCategory.ThreeChillaSathi]: entries(13, SathiCategory.ThreeChillaSathi, [
        ['সাথী মোঃ মিরাজুল ইসলাম মিয়া', '01795-746359'],
        ['ভাই মোঃ তারিক জামিল', '01937-648239'],
        ['ভাই মোঃ আবু হানিফ', '01629-594648'],
        ['ভাই মোঃ সামছুল ইসলাম', '01950-736335'],
        ['ভাই মোঃ আরিফুল ইসলাম'],
        ['ভাই মোঃ ইউসুফ সাহেব'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(13, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ আল আমিন'],
        ['ভাই মোঃ তানভির'],
        ['ভাই মোঃ শিবু'],
        ['ভাই মোঃ নাবিল'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: entries(
        13,
        SathiCategory.MasturatTenFifteenDays,
        [['ভাই মোঃ আবু হানিফ', '01629-594648']]
      ),
      [SathiCategory.MasturatThreeDays]: entries(
        13,
        SathiCategory.MasturatThreeDays,
        [
          ['ভাই মোঃ সুরুজ মিয়া'],
          ['ভাই মোঃ মুরতুজ আলী'],
          ['ভাই মোঃ নাবিল'],
          ['ভাই মোঃ বাবলু সাহেব'],
          ['ভাই মোঃ সিরাজুল ইসলাম'],
          ['ভাই মোঃ আরিফ সাহেব'],
        ]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
  {
    id: 14,
    name: 'বাইতুল ফালাহ জামে মসজিদ',
    address: '',
    khatib: { name: 'মুফতি আব্দুল মতিন', phone: '01916-872516' },
    imam: { name: 'মুফতি বাহারুল ইসলাম', phone: '01813-293169' },
    muazzin: { name: '', phone: '' },
    categories: {
      [SathiCategory.SalwaliUlama]: entries(14, SathiCategory.SalwaliUlama, [
        ['মাও: মুজিবুর রহমান', '01835-989047'],
      ]),
      [SathiCategory.ThreeChillaUlama]: [],
      [SathiCategory.OneChillaUlama]: [],
      [SathiCategory.Bidesh]: entries(14, SathiCategory.Bidesh, [
        ['ভাই মোঃ আলী', '01734-938594'],
      ]),
      [SathiCategory.ThreeChillaSathi]: entries(14, SathiCategory.ThreeChillaSathi, [
        ['ভাই মোঃ কালাম হোসেন', '01673-779519'],
        ['ভাই মোঃ জাহাঙ্গির হোসেন (টুটুল)', '01618-887306'],
        ['ভাই মোঃ নুরে আলম সুমন', '01571-250084'],
        ['ভাই মোঃ মাহদী', '01571-174175'],
      ]),
      [SathiCategory.OneChillaSathi]: entries(14, SathiCategory.OneChillaSathi, [
        ['ভাই মোঃ আবুল কালাম (লস্কর)', '01798-848472'],
        ['ভাই মোঃ শরিফ', '01745-921770'],
      ]),
      [SathiCategory.MasturatChilla]: [],
      [SathiCategory.MasturatTenFifteenDays]: [],
      [SathiCategory.MasturatThreeDays]: entries(
        14,
        SathiCategory.MasturatThreeDays,
        [
          ['ভাই মোঃ কালাম হোসেন', '01673-779519'],
          ['ভাই মোঃ মাহদী', '01571-174175'],
        ]
      ),
      [SathiCategory.ChatraNowjowan]: [],
    },
  },
];

export const INITIAL_MOSQUES: MosqueRecord[] = RAW_INITIAL_MOSQUES.map((m) => ({
  ...m,
  khatib: { ...m.khatib, phone: formatBdPhone(m.khatib.phone) },
  imam: { ...m.imam, phone: formatBdPhone(m.imam.phone) },
  muazzin: { ...m.muazzin, phone: formatBdPhone(m.muazzin.phone) },
}));

export const INITIAL_KARGOOJARIS: KargoojariEntry[] = [
  {
    id: 'karg-2026-11-15-giridhara-chatra-gast',
    date: '2026-11-15',
    mosqueId: 3,
    gastDone: true,
    talimDone: true,
    mashwaraDone: true,
    sathiAttended: 7,
    tashkeelCount: 4,
    reporterName: '',
    summary: `আজকের মেহনত: গিরিধারা কেন্দ্রিক ছাত্র ও নওজোয়ানদের মাঝে দাওয়াতি মেহনত।

আলহামদুলিল্লাহ, আজ মাগরিবের নামাজের পর থেকে রাত ১০টা ১০ মিনিট পর্যন্ত গিরিধারা কেন্দ্রিক ছাত্র ও নওজোয়ানদের মাঝে দাওয়াতি মেহনত পরিচালিত হয়।

মাগরিবের পর:
মাগরিবের নামাজের পর ভাই মোঃ পারভেজ ও ভাই মোঃ কাউসার বায়তুশ শরিফ মসজিদের তিন চিল্লার সাথী আশিক ভাইয়ের সঙ্গে দাওয়াত ও মুজাকারা করেন। তাকে ছাত্র ও নওজোয়ানদের মেহনতের জামাতের সঙ্গে যুক্ত হওয়ার বিষয়টি জানানো হয় এবং জামাতের একজন সাথী হিসেবে তার জন্য দোয়া করা হয়।

পাশাপাশি জুলকার নাইন, আবু তালহা ও ছোট আশিকের সঙ্গে দাওয়াতি মেহনত করা হয়। এছাড়া ফয়সাল, আশিক (বায়তুশ শরিফের সাথী), মাহমুদউল্লাহ সাব্বির (ওমর বিন খাত্তাব মসজিদের সাথী) এবং আরাফাতকে এশার নামাজের পর ছাত্র মেহনতের সঙ্গে শরিক হওয়ার জন্য দাওয়াত দেওয়া হয়।

এশার পর:
এশার নামাজ ও তালিমের আমল শেষ করে ভাই মোঃ মোবারক হোসেনসহ ভাই মোঃ পারভেজ, ভাই মোঃ আরাফাত, ভাই মোঃ ফয়সাল, ভাই মোঃ জিহাদ ও ভাই মোঃ জাহিদ হোসেন গাস্তের জন্য বের হন।

গাস্ত চলাকালীন ছোট আশিক, শামীম, জুবায়ের, কামরুল ইসলাম ও নাঈম হোসেনের সঙ্গে দাওয়াত ও মুজাকারা করা হয়। তাদের সামনে দ্বীনের মেহনতের ফজিলত, মসজিদের সঙ্গে সম্পর্ক এবং আল্লাহর রাস্তায় সময় লাগানোর গুরুত্ব তুলে ধরা হয়।

তিন দিনের জামাতের তাশকিল:
আলহামদুলিল্লাহ, উক্ত গাস্ত ও মুজাকারার মাধ্যমে ভাই মোঃ নাঈম, ভাই মোঃ কামরুল, ভাই মোঃ জুবায়ের এবং জুবায়েরের বড় ভাই ভাই মোঃ জহিরুল ইসলাম আগামী ১৯, ২০ ও ২১ নভেম্বর তিন দিনের জামাতে সময় লাগানোর নিয়ত করেন। আল্লাহ তাআলার দরবারে তাদের এই নিয়ত কবুল হওয়ার জন্য দোয়া করা হয়।

পরবর্তী দিনের মাসোয়ারা:
গাস্ত ও দাওয়াতি মেহনত শেষে সকল সাথী একত্রিত হয়ে পরবর্তী দিনের মেহনতের জন্য মাসোয়ারা করেন। মাসোয়ারা অনুযায়ী আগামী দিনের কাজের দিকনির্দেশনা নিয়ে প্রত্যেক সাথী নিজ নিজ বাসায় চলে যান।

মেহনতের ফিকির:
আমাদের মাকসাদ শুধু কাউকে দাওয়াত দেওয়া নয়; বরং প্রত্যেকের অন্তরে দ্বীনের ফিকির পয়দা করা, মসজিদের সঙ্গে সম্পর্ক মজবুত করা এবং উম্মতের প্রতিটি সদস্যকে আল্লাহর হুকুম ও রাসুলুল্লাহ ﷺ-এর তরিকার ওপর জীবন পরিচালনার জন্য মেহনত করা।

আল্লাহ তাআলা আমাদের এই মেহনতকে কবুল করুন। যাদের সঙ্গে আজ দাওয়াত ও মুজাকারা হয়েছে, তাদের সবাইকে দ্বীনের মেহনতের সঙ্গে কবুল করুন। যারা তিন দিনের জামাতে যাওয়ার নিয়ত করেছেন, তাদের জন্য সময় বের করা সহজ করে দিন এবং আমাদের সবাইকে ইখলাস ও ইস্তেকামাতের সঙ্গে দ্বীনের মেহনত করার তাওফিক দান করুন। আমিন, ইয়া রব্বাল আলামিন।`,
    sathis: [
      {
        id: 'ks-2026-11-15-1',
        name: 'ভাই মোঃ নাঈম',
        phone: '',
        notes: '৩ দিনের জামাত (১৯, ২০, ২১ নভেম্বর)',
      },
      {
        id: 'ks-2026-11-15-2',
        name: 'ভাই মোঃ কামরুল',
        phone: '',
        notes: '৩ দিনের জামাত (১৯, ২০, ২১ নভেম্বর)',
      },
      {
        id: 'ks-2026-11-15-3',
        name: 'ভাই মোঃ জুবায়ের',
        phone: '',
        notes: '৩ দিনের জামাত (১৯, ২০, ২১ নভেম্বর)',
      },
      {
        id: 'ks-2026-11-15-4',
        name: 'ভাই মোঃ জহিরুল ইসলাম',
        phone: '',
        notes: '৩ দিনের জামাত (১৯, ২০, ২১ নভেম্বর)',
      },
    ],
    createdAt: '2026-11-15T22:10:00.000Z',
  },
  {
    id: 'karg-2026-11-14-chatra-mashwara',
    date: '2026-11-14',
    mosqueId: 'halqa',
    gastDone: false,
    talimDone: false,
    mashwaraDone: true,
    sathiAttended: 10,
    tashkeelCount: 1,
    reporterName: '',
    summary: `বিষয়: ছাত্র ও নওজোয়ানদের মাঝে দাওয়াতি মেহনতের উদ্দেশ্যে মাসোয়ারা ও মুজাকারা।

আজ বাদ এশা আমীর সাহেবের (বিপ্লব ভাই) দোকানে ছাত্র মেহনতের জন্য প্রস্তুতকৃত সাথীদের নিয়ে একটি গুরুত্বপূর্ণ এসলা ও মুজাকারা অনুষ্ঠিত হয়।

মজলিশে উপস্থিত সাথীবৃন্দ:
উক্ত মজলিশে উপস্থিত ছিলেন আমীর সাহেব (বিপ্লব), শাহনেওয়াজ (বায়তুশ সালাম), জাহাঙ্গীর (ওমর বিন খাত্তাব মসজিদ)। এছাড়াও উপস্থিত ছিলেন:
১. মোবারক হোসেন — গিরিধর জামে মসজিদ
২. মোরশেদ — আবু বক্কর মসজিদ
৩. জিহাদ — বায়তুশ শরিফ মসজিদ
৪. পারভেজ — গিরিধারা জামে মসজিদ
৫. কাউসার — কাউসার মসজিদ
৬. সজীব — তুষারধারা মসজিদ
৭. রায়হান — ওয়াজ করনি মসজিদ।

আমীর সাহেবের নসিহত ও দিকনির্দেশনা:
মজলিশে আমীর সাহেব ছাত্র ও নওজোয়ানদের মাঝে দ্বীনের মেহনত কীভাবে পরিচালনা করতে হবে, সে বিষয়ে গুরুত্বপূর্ণ নসিহত ও দিকনির্দেশনা প্রদান করেন। বিশেষভাবে জামাতের মাসোয়ারার তাবেদারি এবং মেহনতের ধারাবাহিকতা বজায় রাখার বিষয়ে আলোচনা করেন। পরিশেষে উক্ত জামাতকে ছাত্র ও নওজোয়ানদের মেহনতের জিম্মাদারি প্রদান করা হয়।

আমীর সাহেব আমাদের বিশেষভাবে দুটি বিষয়ের ওপর ইস্তেকামাতের সঙ্গে আমল করার তাকিদ করেন:
১. মাসোয়ারার তাবেদারি: মাসোয়ারায় যে সিদ্ধান্ত গ্রহণ করা হবে, তা যথাযথভাবে বাস্তবায়ন করা এবং ব্যক্তিগত মতামতের পরিবর্তে জামাতের সিদ্ধান্তকে প্রাধান্য দেওয়া।
২. এহতেমামের সঙ্গে মেহনত ও তিন তাসবিহের আমল: প্রত্যেকটি কাজের প্রতি বিশেষ এহতেমাম রাখা, দাওয়াতি মেহনতকে নিয়মতান্ত্রিকভাবে সামনে এগিয়ে নেওয়া এবং প্রতিদিন ইস্তেকামাতের সঙ্গে তিন তাসবিহের আমল করা।

পাশাপাশি দোয়ার পরিমাণ ও এহতেমাম বাড়ানোর ব্যাপারে বিশেষ তাকিদ করেন। উদাহরণস্বরূপ, তিনি বলেন, আমরা যদি আধা কেজি দাওয়াতের মেহনত করি, তাহলে যেন এক কেজি দোয়া করি। অর্থাৎ মেহনতের তুলনায় দোয়ার পরিমাণ আরও বেশি হওয়া উচিত।

এছাড়াও যাদের কাছে দাওয়াত নিয়ে যাওয়া হবে, তাদের সময় ও সুবিধার প্রতি লক্ষ্য রেখে উপযুক্ত সময়ে যাওয়ার পরামর্শ দেন। দাওয়াতের ক্ষেত্রে হিকমত, নম্রতা, মুহাব্বত এবং প্রত্যেকের অবস্থা বিবেচনায় রেখে মেহনত করার বিষয়ে বিভিন্ন নসিহত প্রদান করেন।

ছাত্র ও নওজোয়ানদের মেহনতের পরিকল্পনা:
উক্ত মজলিশে পুরো হালকার মোট ৪২ জন ছাত্র ও নওজোয়ানের একটি তালিকা প্রস্তুত করা হয়। তাদের প্রত্যেকের ওপর মেহনত করার জন্য সাথীদের প্রতি বিশেষ তাকিদ দেওয়া হয়। উদ্দেশ্য হলো, ছাত্র ও নওজোয়ানদের দ্বীনের মেহনতের সঙ্গে সম্পৃক্ত করা এবং ধীরে ধীরে তাদের অন্তরে দ্বীনের ফিকির ও আমলের জজবা পয়দা করা।

তিন দিনের জামাতের জন্য তাশকিল:
মজলিশ শেষে ফেরার পথে মোবারক হোসেন ও পারভেজ মিলে গিরিধারা জামে মসজিদের পাশে অবস্থিত ফার্মেসির অনিক ভাইকে তিন দিনের জামাতের জন্য তাশকিল করেন। আলহামদুলিল্লাহ, তিনি ফার্মেসির ব্যবসার পাশাপাশি দ্বীনের মেহনতে সময় লাগানোর নিয়ত প্রকাশ করেন। ইনশাআল্লাহ, তিনি জামাতের সঙ্গে সময় লাগাবেন।

পরিশেষে:
আজকের এই মজলিশ থেকে আমাদের জন্য অন্যতম শিক্ষা হলো—দ্বীনের মেহনতকে সামনে এগিয়ে নিতে হলে ইখলাস, ইস্তেকামাত, মাসোয়ারার তাবেদারি, এহতেমাম এবং অধিক পরিমাণে দোয়ার প্রয়োজন। বিশেষ করে ছাত্র ও নওজোয়ানদের মাঝে দ্বীনের ফিকির পয়দা করতে হলে নিজেদের আমল, আখলাক ও মেহনতের মাধ্যমেও দৃষ্টান্ত স্থাপন করতে হবে।

আল্লাহ তাআলা আমাদের সবাইকে নিজেদের জিম্মাদারি যথাযথভাবে আদায় করার, ইখলাসের সঙ্গে দ্বীনের মেহনত করার এবং এই মেহনতের ওপর আমৃত্যু ইস্তেকামাত থাকার তাওফিক দান করুন। আমিন, ইয়া রব্বাল আলামিন।`,
    sathis: [
      {
        id: 'ks-2026-11-14-1',
        name: 'অনিক ভাই (ফার্মেসি)',
        phone: '',
        notes: '৩ দিনের জামাতের জন্য তাশকিল (গিরিধারা মসজিদ সংলগ্ন)',
      },
    ],
    createdAt: '2026-11-14T20:30:00.000Z',
  },
];
