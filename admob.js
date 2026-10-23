import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents
} from '@capacitor-community/admob';

const bannerTestId = 'ca-app-pub-3940256099942544/6300978111';
const interstitialTestId = 'ca-app-pub-3940256099942544/1033173712';

let interstitialReady = false;
let calculationCount = 0;
let started = false;

function log(message, detail = '') {
  console.log('[AdMob]', message, detail);
}

async function loadInterstitial() {
  try {
    const result = await AdMob.prepareInterstitial({
      adId: interstitialTestId,
      isTesting: true
    });
    interstitialReady = true;
    log('Interstitial loaded', result);
  } catch (error) {
    interstitialReady = false;
    log('Interstitial load failed', error);
  }
}

async function startAdMob() {
  if (started || Capacitor.getPlatform() !== 'android') return;
  started = true;

  try {
    // Register listeners before requesting ads.
    await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      log('Banner loaded successfully');
    });

    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, error => {
      log('Banner load failed', error);
    });

    await AdMob.addListener(InterstitialAdPluginEvents.Loaded, info => {
      interstitialReady = true;
      log('Interstitial ready', info);
    });

    await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, error => {
      interstitialReady = false;
      log('Interstitial load failed event', error);
    });

    await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, error => {
      log('Interstitial show failed', error);
    });

    // Initialize the native SDK before checking consent.
    await AdMob.initialize();
    log('SDK initialized');

    let consent = await AdMob.requestConsentInfo();
    log('Consent information', consent);

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
      log('Consent form completed', consent);
    }

    if (!consent.canRequestAds) {
      log('Ads not requested: consent does not allow ad requests');
      return;
    }

    await AdMob.showBanner({
      adId: bannerTestId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true
    });

    log('Banner request sent');
    await loadInterstitial();
  } catch (error) {
    log('Initialization or ad request failed', error);
  }
}

window.maybeShowInterstitialAd = async function () {
  calculationCount++;

  if (calculationCount < 5 || !interstitialReady) return;

  calculationCount = 0;
  interstitialReady = false;

  try {
    await AdMob.showInterstitial();
    log('Interstitial show request sent');
  } catch (error) {
    log('Interstitial show failed', error);
  }
};

if (document.readyState === 'complete') {
  startAdMob();
} else {
  window.addEventListener('load', startAdMob, { once: true });
}
