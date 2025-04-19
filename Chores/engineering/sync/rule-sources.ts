import { RuleGroup, SpecialRuleConfig, GlobalConfig } from './rule-types.js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_PATH = path.join(__dirname, '../../..');

export const ruleGroups: RuleGroup[] = [
  {
    name: 'GeoIP',
    files: [
      {
        path: 'GeoIP/CN_Country.mmdb',
        url: 'https://raw.githubusercontent.com/Masaiki/GeoIP2-CN/release/Country.mmdb',
      },
      {
        path: 'GeoIP/Global_Country.mmdb',
        url: 'https://raw.githubusercontent.com/Loyalsoldier/geoip/release/Country.mmdb',
      },
      {
        path: 'GeoIP/IPInfo_Country.mmdb',
        url: 'https://github.com/xream/geoip/releases/latest/download/ipinfo.country.mmdb',
      },
      {
        path: 'GeoIP/IP2Location_Country.mmdb',
        url: 'https://github.com/xream/geoip/releases/latest/download/ip2location.country.mmdb',
      },
      {
        path: 'GeoIP/CNcidr_Country.mmdb',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Country.mmdb',
      },
      {
        path: 'GeoIP/CNcidr_Country_All.mmdb',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Country_All.mmdb',
      },
    ],
  },
  {
    name: 'Apple',
    files: [
      {
        path: 'Surge/Ruleset/apple/apns.list',
        url: 'https://kelee.one/Tool/Loon/Rule/ApplePushNotificationService.list',
      },
      {
        path: 'Surge/Ruleset/apple/apple.conf',
        url: 'https://ruleset.skk.moe/List/non_ip/apple_services.conf',
      },
      {
        path: 'Surge/Ruleset/apple/apple_cn.list',
        url: 'https://ruleset.skk.moe/List/non_ip/apple_cn.conf',
      },
      {
        path: 'Surge/Ruleset/apple/apple_cdn.list',
        url: 'https://ruleset.skk.moe/List/domainset/apple_cdn.conf',
      },
      {
        path: 'Surge/Ruleset/apple/apple_ip.conf',
        url: 'https://ruleset.skk.moe/List/ip/apple_services.conf',
      },
      {
        path: 'Surge/Ruleset/apple/apple_all.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Surge/Apple/Apple_All.list',
      },
      {
        path: 'Surge/Ruleset/apple/appstore.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/source/rule/AppStore/AppStore.list',
      },
      {
        path: 'Surge/Ruleset/apple/appleid.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleID/AppleID.list',
      },
      {
        path: 'Surge/Ruleset/apple/applemusic.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleMusic/AppleMusic.list',
      },
      {
        path: 'Surge/Ruleset/apple/icloud.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/iCloud/iCloud.list',
      },
      {
        path: 'Surge/Ruleset/apple/testflight.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/TestFlight/TestFlight.list',
      },
      {
        path: 'Surge/Ruleset/apple/appleproxy.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleProxy/AppleProxy.list',
      },
      {
        path: 'Surge/Ruleset/apple/applemedia.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleMedia/AppleMedia.list',
      },
    ],
  },
  {
    name: 'AI',
    files: [
      {
        path: 'Surge/Ruleset/aigc.list',
        url: 'https://ruleset.skk.moe/List/non_ip/ai.conf',
      },
      {
        path: 'Surge/Ruleset/aigc_keli.list',
        url: 'https://kelee.one/Tool/Loon/Rule/AI.list',
      },
      {
        path: 'Surge/Ruleset/aigc_connershua.list',
        url: 'https://github.com/ConnersHua/RuleGo/raw/master/Surge/Ruleset/Extra/AI.list',
      },
      /**
      {
        path: 'Surge/Ruleset/aigc_hiven.list',
        url: 'https://raw.githubusercontent.com/hiven425/hiven/master/config/AI.list',
      },
      */
    ],
  },
  {
    name: 'Streaming',
    files: [
      {
        path: 'Surge/Ruleset/streaming/video/netflix.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Netflix.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/disney.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Disney/Disney.list',
      },
      {
        path: 'Surge/Ruleset/streaming/music/spotify.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Spotify/Spotify.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/primevideo.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/PrimeVideo/PrimeVideo.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/bahamut.list',
        url: 'https://github.com/ACL4SSR/ACL4SSR/raw/master/Clash/Ruleset/Bahamut.list',
      },
      {
        path: 'Surge/Ruleset/streaming/proxymedia.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyMedia.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/youtube.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/YouTube.list',
      },
      {
        path: 'Surge/Ruleset/streaming/globalmedia.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Rules/master/GlobalMedia.list',
      },
      {
        path: 'Surge/Ruleset/streaming/music/neteasemusic.list',
        url: 'https://ruleset.skk.moe/List/non_ip/neteasemusic.conf',
      },
      {
        path: 'Surge/Ruleset/streaming/music/neteasemusic_noip.list',
        url: 'https://ruleset.skk.moe/List/ip/neteasemusic.conf',
      },
      {
        path: 'Surge/Ruleset/streaming/video/emby.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Rules/Emby.list',
        description: 'This file contains rules for EmbyServer.',
      },
      {
        path: 'Surge/Ruleset/streaming/video/embytest.list',
        url: 'https://github.com/ocd0711/Profiles/raw/master/Surge/Ruleset/emby.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/embydirect.list',
        url: 'https://github.com/zhaolook/zzz/raw/main/EmbyDirect.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/bilibiliintl.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/BiliBiliIntl/BiliBiliIntl.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/bilibili.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Bilibili.list',
      },
      {
        path: 'Surge/Ruleset/streaming/video/tiktok.list',
        url: 'https://kelee.one/Tool/Loon/Rule/TikTok.list',
      },
      {
        path: 'Surge/Ruleset/streaming/cn.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Extra/Streaming/CN.list',
      },
      {
        path: 'Surge/Ruleset/streaming/!cn.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Extra/Streaming/!CN.list',
      },
      {
        path: 'Surge/Ruleset/streaming/streaming.list',
        url: 'https://ruleset.skk.moe/List/non_ip/stream.conf',
      },
      {
        path: 'Surge/Ruleset/streaming/streaming_ip.list',
        url: 'https://ruleset.skk.moe/List/ip/stream.conf',
      },
    ],
  },
  {
    name: 'Reject',
    files: [
      {
        path: 'Surge/Ruleset/reject/advertising.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Extra/Reject/Advertising.list',
      },
      {
        path: 'Surge/Ruleset/reject/malicious.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Extra/Reject/Malicious.list',
      },
      {
        path: 'Surge/Ruleset/reject/tracking.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Extra/Reject/Tracking.list',
      },
      {
        path: 'Surge/Ruleset/reject/ads_fmz200.list',
        url: 'https://raw.githubusercontent.com/fmz200/wool_scripts/main/QuantumultX/filter/fenliu.list',
      },
      {
        path: 'Surge/Ruleset/reject/ads_sukka.list',
        url: 'https://ruleset.skk.moe/List/domainset/reject.conf',
      },
      {
        path: 'Surge/Ruleset/reject/ads_sukka_noip.list',
        url: 'https://ruleset.skk.moe/List/non_ip/reject.conf',
      },
      {
        path: 'Surge/Ruleset/reject/ads_sukka_extra.list',
        url: 'https://ruleset.skk.moe/List/domainset/reject_extra.conf',
      },
      {
        path: 'Surge/Ruleset/reject/ads_sukka_ip.list',
        url: 'https://ruleset.skk.moe/List/ip/reject.conf',
      },
      {
        path: 'Surge/Ruleset/reject/ads_limbopro.list',
        url: 'https://raw.githubusercontent.com/limbopro/Adblock4limbo/main/Adblock4limbo_surge.list',
      },
      {
        path: 'Surge/Ruleset/reject/ads_sukka_reject_no_drop.list',
        url: 'https://ruleset.skk.moe/List/non_ip/reject-no-drop.conf',
      },
      {
        path: 'Surge/Ruleset/reject/ads_sukka_reject_drop.list',
        url: 'https://ruleset.skk.moe/List/non_ip/reject-drop.conf',
      },
    ],
  },
  {
    name: 'Direct',
    files: [
      {
        path: 'Surge/Ruleset/direct/direct_fmz200.list',
        url: 'https://github.com/fmz200/wool_scripts/raw/main/QuantumultX/filter/fenliuxiuzheng.list',
      },
      {
        path: 'Surge/Ruleset/direct/direct_sukka.list',
        url: 'https://ruleset.skk.moe/List/non_ip/direct.conf',
      },
      {
        path: 'Surge/Ruleset/direct/mydirect_sukka.list',
        url: 'https://ruleset.skk.moe/List/non_ip/my_direct.conf',
      },
    ],
  },
  {
    name: 'Anti',
    files: [
      {
        path: 'Surge/Ruleset/anti-attribution/direct.list',
        url: 'https://github.com/SunsetMkt/anti-ip-attribution/raw/main/generated/rule-set-direct.list',
        title: 'DIRECT (Anti-IP Attribution)',
        description: 'Anti IP attribution direct rules',
        header: {
          enable: true, // 明确启用 header
        },
      },
      {
        path: 'Surge/Ruleset/anti-attribution/proxy.list',
        url: 'https://github.com/SunsetMkt/anti-ip-attribution/raw/main/generated/rule-set-proxy.list',
        title: 'PROXY (Anti-IP Attribution)',
        description: 'Anti IP attribution proxy rules',
        header: {
          enable: true, // 明确启用 header
        },
      },
      {
        path: 'Surge/Ruleset/anti-attribution/reject.list',
        url: 'https://github.com/SunsetMkt/anti-ip-attribution/raw/main/generated/rule-set-reject.list',
        title: 'REJECT (Anti-IP Attribution)',
        description: 'Anti IP attribution reject rules',
        header: {
          enable: true, // 明确启用 header
        },
      },
    ],
  },
  {
    name: 'Domestic',
    files: [
      {
        path: 'Surge/Ruleset/domestic/wechat.list',
        url: 'https://raw.githubusercontent.com/NobyDa/Script/master/Surge/WeChat.list',
      },
      {
        path: 'Surge/Ruleset/domestic/chinedomain.list',
        url: 'https://ruleset.skk.moe/List/non_ip/domestic.conf',
      },
      {
        path: 'Surge/Ruleset/domestic/domestic_sukka_noip.list',
        url: 'https://ruleset.skk.moe/List/non_ip/domestic.conf',
      },
      {
        path: 'Surge/Ruleset/domestic/domestic_sukka_ip.list',
        url: 'https://ruleset.skk.moe/List/ip/domestic.conf',
      },
      {
        path: 'Surge/Ruleset/domestic/domestic_sukka_direct.list',
        url: 'https://ruleset.skk.moe/List/non_ip/direct.conf',
      },
      {
        path: 'Surge/Ruleset/domestic/china.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/China/China.list',
      },
      {
        path: 'Surge/Ruleset/domestic/chinamax.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/ChinaMax/ChinaMax.list',
      },
      {
        path: 'Surge/Ruleset/domestic/domestic.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Rules/master/Domestic.list',
      },
    ],
  },
  {
    name: 'CDN',
    files: [
      {
        path: 'Surge/Ruleset/cdn/download_global.list',
        url: 'https://kelee.one/Tool/Loon/Rule/InternationalDownloadCDN.list',
      },
      {
        path: 'Surge/Ruleset/cdn/download_cn.list',
        url: 'https://kelee.one/Tool/Loon/Rule/ChinaDownloadCDN.list',
      },
      {
        path: 'Surge/Ruleset/cdn.list',
        url: 'https://ruleset.skk.moe/List/domainset/cdn.conf',
      },
      {
        path: 'Surge/Ruleset/cdn_noip.list',
        url: 'https://ruleset.skk.moe/List/non_ip/cdn.conf',
      },
      {
        path: 'Surge/Ruleset/cdn_ip.list',
        url: 'https://ruleset.skk.moe/List/ip/cdn.conf',
      },
    ],
  },
  {
    name: 'IPCIDR',
    files: [
      {
        path: 'Surge/Ruleset/ipcird/chinaip_sukka.list',
        url: 'https://ruleset.skk.moe/List/ip/china_ip.conf',
      },
      {
        path: 'Surge/Ruleset/ipcird/chinaip_dh_ns.list',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Geo_AS_IP_CN.txt',
        title: 'IPv4+IPv6 Information in China.',
        description: 'Made by DH-Teams, All rights reserved',
        header: {
          enable: true, // 明确启用 header
        },
      },

      {
        path: 'Surge/Ruleset/ipcird/chinaipv4_dh.list',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Geo_AS_IP_CN_V4_Surge.list',
        title: 'IPv4 Information in China.',
        description: 'Made by DH-Teams, All rights reserved',
        header: {
          enable: true, // 明确启用 header
        },
      },
      {
        path: 'Surge/Ruleset/ipcird/chinaasn_fries.list',
        url: 'https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list',
        cleanup: false,
      },
      {
        path: 'Surge/Ruleset/chinaasn_missuo.list',
        url: 'https://raw.githubusercontent.com/missuo/ASN-China/main/ASN.China.list',
        cleanup: false,
      },
      {
        path: 'Surge/Ruleset/ipcird/chinaasn_dh.list',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Geo_AS_CN.list',
        title: 'ASN Information in China.',
        description: 'Made by DH-Teams, All rights reserved',
        header: {
          enable: true, // 明确启用 header
        },
      },
    ],
  },
  {
    name: 'Lan',
    files: [
      {
        path: 'Surge/Ruleset/lan.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Rules/master/Special/Local-LAN.list',
      },
    ],
  },
  {
    name: 'Social',
    files: [
      {
        path: 'Surge/Ruleset/social/twitter.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Twitter.list',
      },
      {
        path: 'Surge/Ruleset/social/instagram.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Instagram.list',
      },
      {
        path: 'Surge/Ruleset/social/facebook.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Facebook.list',
      },
      {
        path: 'Surge/Ruleset/telegram.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Rules/Telegram.list',
      },
    ],
  },
  {
    name: 'Extra',
    files: [
      /**
      {
        path: 'Surge/Ruleset/extra/direct.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Rules/Direct.list',
      },
      {
        path: 'Surge/Ruleset/extra/reject.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Rules/Reject.list',
      },
      {
        path: 'Surge/Ruleset/extra/proxy.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Rules/Proxy.list',
      },
      {
        path: 'Surge/Ruleset/extra/prevent_dns_leaks.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Rules/Prevent_DNS_Leaks.list',
      }
          */
      {
        path: 'Surge/Ruleset/extra/speedtest.list',
        url: 'https://kelee.one/Tool/Loon/Rule/OoklaSpeedtest.list',
      },
    ],
  },
  {
    name: 'GFW',
    files: [
      {
        path: 'Surge/Ruleset/global.list',
        url: 'https://ruleset.skk.moe/List/non_ip/global.conf',
      },
      {
        path: 'Surge/Ruleset/blocked.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyGFWlist.list',
      },
      /** 
      {
        path: 'Surge/Ruleset/ProxyLite_ACL4SSR.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyLite.list',
      },
      */
      {
        path: 'Surge/Ruleset/proxylite.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/ProxyLite/ProxyLite.list',
      },
      {
        path: 'Surge/Ruleset/proxy_lm.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Rules/master/PROXY.list',
      },
      {
        path: 'Surge/Ruleset/proxy.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/Proxy/Proxy.list',
      },
      {
        path: 'Surge/Ruleset/proxy_tartarus.list',
        url: 'https://github.com/Tartarus2014/For-own-use/raw/master/Ruleset/Proxy.list',
      },
    ],
  },
  {
    name: 'Google',
    files: [
      {
        path: 'Surge/Ruleset/google/google.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Google.list',
      },
    ],
  },
  {
    name: 'Microsoft',
    files: [
      {
        path: 'Surge/Ruleset/microsoft/github.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Github.list',
      },
      {
        path: 'Surge/Ruleset/microsoft/microsoft.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Microsoft.list',
      },
    ],
  },
];

// Special rules configuration
export const specialRules: SpecialRuleConfig[] = [
  {
    name: 'AI',
    targetFile: 'Surge/Ruleset/aigc.list',
    sourceFiles: ['Surge/Ruleset/aigc_keli.list', 'Surge/Ruleset/aigc_connershua.list'],
    extraRules: ['DOMAIN-SUFFIX,openrouter.ai'],
    cleanup: true,
    header: {
      title: 'AIGC Services',
      description:
        'Rules for AI services including OpenAI, Google Gemini, Claude, Perplexity and other generative AI platforms',
    },
  },
  {
    name: 'Apple',
    targetFile: 'Surge/Ruleset/apple/apple.list',
    sourceFiles: [
      'Surge/Ruleset/apple/apple.conf',
      'Surge/Ruleset/apple/apple_cn.list',
      'Surge/Ruleset/apple/apple_ip.conf',
      'Surge/Ruleset/apple/apple_cdn.list',
    ],
    cleanup: true,
    header: {
      title: 'Apple Services',
      description:
        'Rules for Apple services, including services operated in mainland China (iCloud.com.cn, Apple Maps China, etc).',
    },
  },
  {
    name: 'Reject',
    targetFile: 'Surge/Ruleset/reject.list',
    sourceFiles: [
      'Surge/Ruleset/reject/advertising.list',
      'Surge/Ruleset/reject/malicious.list',
      'Surge/Ruleset/reject/tracking.list',
    ],
    cleanup: false,
    dedup: true,
    header: {
      enable: true,
      title: 'Advertising, Malicious Sites & Tracking Protection',
      description: 'Combined rules for blocking ads, malicious sites and user tracking services',
    },
  },
  {
    name: 'Reject (Sukka)',
    targetFile: 'Surge/Ruleset/reject_sukka.list',
    sourceFiles: [
      'Surge/Ruleset/reject/ads_sukka.list',
      'Surge/Ruleset/reject/ads_sukka_noip.list',
      'Surge/Ruleset/reject/ads_sukka_extra.list',
    ],
    cleanup: true,
    header: {
      enable: true,
      title: 'Privacy & Security Protection',
      description:
        'Comprehensive ruleset for blocking advertising, privacy-invasive services, malware, and phishing sites',
    },
  },
  {
    name: 'Reject-No-Drop (Sukka)',
    targetFile: 'Surge/Ruleset/reject_nodrop_sukka.list',
    sourceFiles: ['Surge/Ruleset/reject/ads_sukka_reject_no_drop.list'],
    cleanup: true,
    header: {
      enable: true,
      title: 'REJECT-NO-DROP Rules',
      description:
        'Advertising & tracking rules using REJECT-NO-DROP policy for services that require connection but content should be blocked',
    },
  },
  {
    name: 'Reject-Drop (Sukka)',
    targetFile: 'Surge/Ruleset/reject_drop_sukka.list',
    sourceFiles: ['Surge/Ruleset/reject/ads_sukka_reject_drop.list'],
    cleanup: true,
    header: {
      enable: true,
      title: 'REJECT-DROP Rules',
      description:
        'Aggressive blocking ruleset using REJECT-DROP policy for complete connection termination of unwanted services',
    },
  },
  {
    name: 'CDN',
    targetFile: 'Surge/Ruleset/cdn.list',
    sourceFiles: ['Surge/Ruleset/cdn_noip.list', 'Surge/Ruleset/cdn_ip.list'],
    cleanup: false,
    dedup: true,
    deleteSourceFiles: true,
    header: {
      enable: true,
      title: 'Content Delivery Networks',
      description:
        'Rules for common static content CDNs to optimize content delivery and network performance',
    },
  },
  {
    name: 'Emby',
    targetFile: 'Surge/Ruleset/streaming/video/embytest.list',
    sourceFiles: [
      'https://github.com/m4v8vsyj/me/raw/main/emby.list',
      'https://github.com/KuGouGo/Rules/raw/main/emby.list',
      //'https://github.com/kefengyoyo/own/raw/main/Emby-P.list',
      'https://github.com/forevergooe/Rules/raw/master/Surge/Emby.list',
      'https://github.com/yahngming/rules/raw/master/emby.list',
      //'https://github.com/Boyce3/Clash/raw/main/Rules/Emby.yaml',
    ],
    cleanup: true,
    keepInlineComments: true,
    dedup: true,
    applyNoResolve: true,
    deleteSourceFiles: false,
    header: {
      enable: true,
      title: 'Emby Media Servers',
      description:
        'Comprehensive rules for various Emby media servers, combining multiple sources including Clash format rules',
    },
  },
  {
    name: 'Emby Streaming Media (Direct)',
    targetFile: 'Surge/Ruleset/streaming/video/embydirect.list',
    sourceFiles: ['https://github.com/h05n/-/raw/main/直连emby'],
    cleanup: true,
    applyNoResolve: true,
    header: {
      enable: true,
      title: 'Direct Emby Connections',
      description:
        'Rules for Emby servers that can be accessed directly from Mainland China without proxy. Includes optimized paths for better performance within China network.',
    },
  },
  {
    name: 'NeteaseMusic',
    targetFile: 'Surge/Ruleset/streaming/music/neteasemusic.list',
    sourceFiles: ['Surge/Ruleset/streaming/music/neteasemusic_noip.list'],
    cleanup: true,
    header: {
      title: 'NetEase Cloud Music',
      description:
        'Rules for NetEase Cloud Music streaming service, optimized for China mainland access',
    },
  },
  {
    name: 'Streaming',
    targetFile: 'Surge/Ruleset/streaming/streaming.list',
    sourceFiles: ['Surge/Ruleset/streaming/streaming_ip.list'],
    header: {
      enable: true,
      title: 'Global Streaming Services',
      description:
        'Combined rules for various streaming media platforms including both domain and IP-based matches',
    },
  },
  {
    name: 'Domestic (Sukka)',
    targetFile: 'Surge/Ruleset/domestic_sukka.list',
    sourceFiles: [
      'Surge/Ruleset/domestic/domestic_sukka_noip.list',
      'Surge/Ruleset/domestic/domestic_sukka_ip.list',
      'Surge/Ruleset/domestic/domestic_sukka_direct.list',
    ],
    cleanup: false,
    dedup: true,
    header: {
      enable: true,
      title: 'China Mainland Direct Access',
      description:
        'Comprehensive rules for domains and IPs that are accessible within Mainland China, optimized for direct connection',
    },
  },
  {
    name: 'Direct (Sukka)',
    targetFile: 'Surge/Ruleset/direct/direct_sukka.list',
    sourceFiles: ['Surge/Ruleset/direct/mydirect_sukka.list'],
    cleanup: false,
    dedup: true,
    header: {
      enable: true,
      title: 'Direct Connection Rules',
      description:
        'Specific rules for services that should bypass proxy and connect directly for optimal performance',
    },
  },
];

export const config = {
  repoPath: REPO_PATH,
  defaultFormat: 'Surge',
  cleanup: false,
  stats: true,
  converter: {
    format: 'Surge',
  },
};
