import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdSize,
  BannerAdPosition
} from '@capacitor-community/admob';

const bannerTestId = 'ca-app-pub-3940256099942544/6300978111';
const interstitialTestId = 'ca-app-pub-3940256099942544/1033173712';

let interstitialReady = false;
let calculationCount = 0;

async function loadInterstitial() {
  try {
    await AdMob.prepareInterstitial({
      adId: interstitialTestId,
      isTesting: true
    });
    interstitialReady = true;
  } catch (error) {
    console.warn('Interstitial test ad failed to load:', error);
  }
}

async function startAdMob() {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    let consent = await AdMob.requestConsentInfo();

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
    }

    if (!consent.canRequestAds) return;

    await AdMob.initialize();

    await AdMob.showBanner({
      adId: bannerTestId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true
    });

    await loadInterstitial();
    console.log('AdMob test ads initialized');
  } catch (error) {
    console.warn('AdMob initialization failed:', error);
  }
}

window.maybeShowInterstitialAd = async function () {
  calculationCount++;

  if (calculationCount < 5 || !interstitialReady) return;

  calculationCount = 0;
  interstitialReady = false;

  try {
    await AdMob.showInterstitial();
  } catch (error) {
    console.warn('Interstitial test ad failed to show:', error);
  } finally {
    await loadInterstitial();
  }
};

window.addEventListener('load', startAdMob);
