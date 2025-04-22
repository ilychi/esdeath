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
        path: 'GeoIP/Hackl0us/CN.mmdb',
        url: 'https://github.com/Hackl0us/GeoIP2-CN/raw/release/Country.mmdb',
      },
      {
        path: 'GeoIP/Masaiki/CN.mmdb',
        url: 'https://github.com/Masaiki/GeoIP2-CN/raw/release/Country.mmdb',
      },
      {
        path: 'GeoIP/soffchen/CN.mmdb',
        url: 'https://raw.githubusercontent.com/soffchen/GeoIP2-CN/release/Country.mmdb',
      },
      {
        path: 'GeoIP/Loyalsoldier/CN.mmdb',
        url: 'https://raw.githubusercontent.com/Loyalsoldier/geoip/release/Country-only-cn-private.mmdb',
      },
      {
        path: 'GeoIP/xream/ipinfo.mmdb',
        url: 'https://github.com/xream/geoip/releases/latest/download/ipinfo.country.mmdb',
      },
      {
        path: 'GeoIP/xream/ip2.mmdb',
        url: 'https://github.com/xream/geoip/releases/latest/download/ip2location.country.mmdb',
      },
      {
        path: 'GeoIP/DH-Teams/CNv4.mmdb',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Country.mmdb',
      },
    ],
  },
  {
    name: 'Apple',
    files: [
      {
        path: 'Ruleset/apple/apns.list',
        url: 'https://kelee.one/Tool/Loon/Rule/ApplePushNotificationService.list',
      },
      {
        path: 'Ruleset/apple/apple_all.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Surge/Apple/Apple_All.list',
      },
      {
        path: 'Ruleset/apple/applemusic.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleMusic/AppleMusic.list',
      },
      {
        path: 'Ruleset/apple/icloud.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/iCloud/iCloud.list',
      },
      {
        path: 'Ruleset/apple/testflight.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/TestFlight/TestFlight.list',
      },
      {
        path: 'Ruleset/apple/appleproxy.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleProxy/AppleProxy.list',
      },
      {
        path: 'Ruleset/apple/applemedia.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/AppleMedia/AppleMedia.list',
      },
    ],
  },
  {
    name: 'Streaming',
    files: [
      {
        path: 'Ruleset/stream/video/netflix.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Netflix.list',
      },
      {
        path: 'Ruleset/stream/video/disney.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Disney/Disney.list',
      },
      {
        path: 'Ruleset/stream/music/spotify.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Spotify/Spotify.list',
      },
      {
        path: 'Ruleset/stream/video/primevideo.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/PrimeVideo/PrimeVideo.list',
      },
      {
        path: 'Ruleset/stream/video/bahamut.list',
        url: 'https://github.com/ACL4SSR/ACL4SSR/raw/master/Clash/Ruleset/Bahamut.list',
      },
      {
        path: 'Ruleset/stream/proxymedia.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyMedia.list',
      },
      {
        path: 'Ruleset/stream/video/youtube.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/YouTube.list',
      },
      {
        path: 'Ruleset/stream/globalmedia.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Ruleset/master/GlobalMedia.list',
      },
      {
        path: 'Ruleset/stream/video/emby.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Ruleset/Emby.list',
        description: 'This file contains rules for EmbyServer.',
      },
      {
        path: 'Ruleset/stream/video/embytest.list',
        url: 'https://github.com/ocd0711/Profiles/raw/master/Ruleset/emby.list',
      },
      {
        path: 'Ruleset/stream/video/biliintl.list',
        url: 'https://ruleset.skk.moe/List/non_ip/stream_biliintl.conf',
      },
      {
        path: 'Ruleset/stream/video/bilibili.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Bilibili.list',
      },
      {
        path: 'Ruleset/stream/video/tiktok.list',
        url: 'https://kelee.one/Tool/Loon/Rule/TikTok.list',
      },
      {
        path: 'Ruleset/stream/cn.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Ruleset/Extra/Streaming/CN.list',
      },
      {
        path: 'Ruleset/stream/!cn.list',
        url: 'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Ruleset/Extra/Streaming/!CN.list',
      },
    ],
  },
  {
    name: 'Reject',
    files: [
      {
        path: 'Ruleset/reject/fmz200_adblock.list',
        url: 'https://raw.githubusercontent.com/fmz200/wool_scripts/main/QuantumultX/filter/fenliu.list',
      },
      {
        path: 'Ruleset/reject/reject-no-drop.list',
        url: 'https://ruleset.skk.moe/List/non_ip/reject-no-drop.conf',
      },
      {
        path: 'Ruleset/reject/reject-drop.list',
        url: 'https://ruleset.skk.moe/List/non_ip/reject-drop.conf',
      },
    ],
  },
  {
    name: 'Direct',
    files: [
      {
        path: 'Ruleset/direct/direct_fmz200.list',
        url: 'https://github.com/fmz200/wool_scripts/raw/main/QuantumultX/filter/fenliuxiuzheng.list',
      },
    ],
  },
  {
    name: 'Anti',
    files: [
      {
        path: 'Ruleset/anti-attribution/direct.list',
        url: 'https://github.com/SunsetMkt/anti-ip-attribution/raw/main/generated/rule-set-direct.list',
        title: 'DIRECT (Anti-IP Attribution)',
        description: 'Anti IP attribution direct rules',
        header: {
          enable: true, // 明确启用 header
        },
      },
      {
        path: 'Ruleset/anti-attribution/proxy.list',
        url: 'https://github.com/SunsetMkt/anti-ip-attribution/raw/main/generated/rule-set-proxy.list',
        title: 'PROXY (Anti-IP Attribution)',
        description: 'Anti IP attribution proxy rules',
        header: {
          enable: true, // 明确启用 header
        },
      },
      {
        path: 'Ruleset/anti-attribution/reject.list',
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
      /**{
        path: 'Ruleset/domestic/wechat.list',
        url: 'https://raw.githubusercontent.com/NobyDa/Script/master/Surge/WeChat.list',
      },
      */
      {
        path: 'Ruleset/domestic/wechat.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/WeChat/WeChat.list',
      },

      {
        path: 'Ruleset/domestic/cn_bm7.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/China/China.list',
      },
      {
        path: 'Ruleset/domestic/cnmax_bm7.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/ChinaMax/ChinaMax.list',
      },
      {
        path: 'Ruleset/domestic/cn_lmfirefly.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Ruleset/master/Domestic.list',
      },
    ],
  },
  {
    name: 'CDN',
    files: [
      {
        path: 'Ruleset/cdn/download_global_kelee.list',
        url: 'https://kelee.one/Tool/Loon/Rule/InternationalDownloadCDN.list',
      },
      {
        path: 'Ruleset/cdn/download_cn_kelee.list',
        url: 'https://kelee.one/Tool/Loon/Rule/ChinaDownloadCDN.list',
      },
    ],
  },
  {
    name: 'IPCIDR',
    files: [
      {
        path: 'Ruleset/ipcidr/chinaip.list',
        url: 'https://ruleset.skk.moe/List/ip/china_ip.conf',
      },
      {
        path: 'Ruleset/ipcidr/chinaip_DH.list',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Geo_AS_IP_CN.txt',
        title: 'IPv4+IPv6 Information in China.',
        description: 'Made by DH-Teams, All rights reserved',
        header: {
          enable: true, // 明确启用 header
        },
      },
      /**
      {
        path: 'Ruleset/ipcidr/chinaipv4_DH.list',
        url: 'https://raw.githubusercontent.com/DH-Teams/DH-Geo_AS_IP_CN/main/Geo_AS_IP_CN_V4_Surge.list',
        title: 'IPv4 Information in China.',
        description: 'Made by DH-Teams, All rights reserved',
        header: {
          enable: true, // 明确启用 header
        },
      },
      */
      {
        path: 'Ruleset/asn/VirgilClyne/CN.list',
        url: 'https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list',
        cleanup: false,
      },
      {
        path: 'Ruleset/ASN/missuo/CN.list',
        url: 'https://raw.githubusercontent.com/missuo/ASN-China/main/ASN.China.list',
        cleanup: false,
      },
      {
        path: 'Ruleset/ASN/DH-Teams/CN.list',
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
        path: 'Ruleset/lan/lan_lmf.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Ruleset/master/Special/Local-LAN.list',
      },
    ],
  },
  {
    name: 'Social',
    files: [
      {
        path: 'Ruleset/social/twitter.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Twitter.list',
      },
      {
        path: 'Ruleset/social/instagram.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Instagram.list',
      },
      {
        path: 'Ruleset/social/facebook.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Facebook.list',
      },
      {
        path: 'Ruleset/telegram.list',
        url: 'https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Ruleset/Telegram.list',
      },
    ],
  },
  {
    name: 'Extra',
    files: [
      {
        path: 'Ruleset/extra/speedtest.list',
        url: 'https://kelee.one/Tool/Loon/Rule/OoklaSpeedtest.list',
      },
    ],
  },
  {
    name: 'Proxy',
    files: [
      {
        path: 'Ruleset/proxy/my_proxy.list',
        url: 'https://ruleset.skk.moe/List/non_ip/my_proxy.conf',
      },
      {
        path: 'Ruleset/proxy/my_git.list',
        url: 'https://ruleset.skk.moe/List/non_ip/my_git.conf',
      },
      {
        path: 'Ruleset/global.list',
        url: 'https://ruleset.skk.moe/List/non_ip/global.conf',
      },
      /**
      {
        path: 'Ruleset/gfw.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyGFWlist.list',
      },
      */
      {
        path: 'Ruleset/proxy/proxylite.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/ProxyLite/ProxyLite.list',
      },
      {
        path: 'Ruleset/proxy/proxy_lmf.list',
        url: 'https://raw.githubusercontent.com/LM-Firefly/Ruleset/master/PROXY.list',
      },
      {
        path: 'Ruleset/proxy/proxy.list',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/Proxy/Proxy.list',
      },
    ],
  },
  {
    name: 'Google',
    files: [
      {
        path: 'Ruleset/google/google.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Google.list',
      },
    ],
  },
  {
    name: 'Microsoft',
    files: [
      {
        path: 'Ruleset/microsoft/github.list',
        url: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Github.list',
      },
    ],
  },
];

// Special rules configuration
export const specialRules: SpecialRuleConfig[] = [
  {
    name: 'AI',
    targetFile: 'Ruleset/aigc.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/ai.conf',
      'https://kelee.one/Tool/Loon/Rule/AI.list',
      'https://github.com/ConnersHua/RuleGo/raw/master/Ruleset/Extra/AI.list',
    ],
    extraRules: ['DOMAIN-SUFFIX,openrouter.ai'],
    cleanup: true,
    deleteSourceFiles: true,
    header: {
      title: 'AIGC Services',
      description:
        'Rules for AI services including OpenAI, Google Gemini, Claude, Perplexity and other generative AI platforms',
    },
  },
  {
    name: 'Apple',
    targetFile: 'Ruleset/apple/apple.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/apple_services.conf',
      'https://ruleset.skk.moe/List/non_ip/apple_cn.conf',
      'https://ruleset.skk.moe/List/domainset/apple_cdn.conf',
      'https://ruleset.skk.moe/List/ip/apple_services.conf',
      'https://ruleset.skk.moe/List/domainset/icloud_private_relay.conf',
    ],
    cleanup: true,
    header: {
      title: 'Apple Services',
      description:
        'Rules for Apple services, including services operated in mainland China (iCloud.com.cn, Apple Maps China, etc).',
    },
  },
  {
    name: 'Microsoft',
    targetFile: 'Ruleset/microsoft/microsoft.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/microsoft.conf',
      'https://ruleset.skk.moe/List/non_ip/microsoft_cdn.conf',
    ],
    cleanup: true,
    header: {
      title: 'Microsoft Services',
      description:
        'Rules for Microsoft services, including services operated in mainland China (Microsoft 365, Microsoft Teams, etc).',
    },
  },
  {
    name: 'Reject',
    targetFile: 'Ruleset/reject/block.list',
    sourceFiles: [
      'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Ruleset/Extra/Reject/Advertising.list',
      'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Ruleset/Extra/Reject/Malicious.list',
      'https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Ruleset/Extra/Reject/Tracking.list',
      'https://raw.githubusercontent.com/privacy-protection-tools/anti-AD/master/anti-ad-surge.txt',
      'https://raw.githubusercontent.com/Cats-Team/AdRuleset/main/adrules.list',
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
    targetFile: 'Ruleset/reject.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/domainset/reject.conf',
      'https://ruleset.skk.moe/List/non_ip/reject.conf',
      'https://ruleset.skk.moe/List/domainset/reject_extra.conf',
      'https://ruleset.skk.moe/List/ip/reject.conf',
      'https://ruleset.skk.moe/List/non_ip/my_reject.conf',
    ],
    cleanup: true,
    deleteSourceFiles: true,
    header: {
      enable: true,
      title: 'Privacy & Security Protection',
      description:
        'Comprehensive ruleset for blocking advertising, privacy-invasive services, malware, and phishing sites',
    },
  },
  {
    name: 'CDN',
    targetFile: 'Ruleset/cdn.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/cdn.conf',
      'https://ruleset.skk.moe/List/ip/cdn.conf',
    ],
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
    targetFile: 'Ruleset/stream/video/embytest.list',
    sourceFiles: [
      'https://github.com/m4v8vsyj/me/raw/main/emby.list',
      'https://github.com/KuGouGo/Ruleset/raw/main/emby.list',
      //'https://github.com/kefengyoyo/own/raw/main/Emby-P.list',
      'https://github.com/forevergooe/Ruleset/raw/master/Surge/Emby.list',
      'https://github.com/yahngming/Ruleset/raw/master/emby.list',
      //'https://github.com/Boyce3/Clash/raw/main/Ruleset/Emby.yaml',
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
    targetFile: 'Ruleset/stream/video/embydirect.list',
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
    targetFile: 'Ruleset/stream/music/neteasemusic.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/neteasemusic.conf',
      'https://ruleset.skk.moe/List/ip/neteasemusic.conf',
    ],
    cleanup: true,
    deleteSourceFiles: true,
    header: {
      title: 'NetEase Cloud Music',
      description:
        'Rules for NetEase Cloud Music streaming service, optimized for China mainland access',
    },
  },
  {
    name: 'Streaming',
    targetFile: 'Ruleset/stream/stream.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/stream.conf',
      'https://ruleset.skk.moe/List/ip/stream.conf',
    ],
    header: {
      enable: true,
      title: 'Global Streaming Services',
      description:
        'Combined rules for various streaming media platforms including both domain and IP-based matches',
    },
  },
  {
    name: 'Domestic (Sukka)',
    targetFile: 'Ruleset/domestic.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/domestic.conf',
      'https://ruleset.skk.moe/List/non_ip/domestic.conf',
      'https://ruleset.skk.moe/List/ip/domestic.conf',
      'https://ruleset.skk.moe/List/non_ip/direct.conf',
    ],
    cleanup: false,
    dedup: true,
  },
  {
    name: 'Direct (Sukka)',
    targetFile: 'Ruleset/direct.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/my_direct.conf',
      'https://ruleset.skk.moe/List/non_ip/direct.conf',
    ],
    cleanup: false,
    dedup: true,
  },
  {
    name: 'Lan',
    targetFile: 'Ruleset/lan/lan.list',
    sourceFiles: [
      'https://ruleset.skk.moe/List/non_ip/lan.conf',
      'https://ruleset.skk.moe/List/ip/lan.conf',
    ],
    cleanup: false,
    dedup: true,
  },
];

export const config = {
  repoPath: REPO_PATH,
  defaultFormat: 'Surge',
  deleteSourceFiles: true,
  cleanup: false,
  stats: true,
  converter: {
    format: 'Surge',
  },
};
