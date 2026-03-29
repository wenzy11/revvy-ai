"use client";

import { deleteApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseWebConfig, type FirebaseWebConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * undefined = sadece build-time env kullan
 * null = API denendi, Firebase yok
 * object = API veya env'den gelen config
 */
let clientOverride: FirebaseWebConfig | null | undefined = undefined;

function resolveConfig(): FirebaseWebConfig | null {
  if (clientOverride !== undefined) {
    return clientOverride;
  }
  return getFirebaseWebConfig();
}

export function setFirebaseClientOverride(next: FirebaseWebConfig | null | undefined) {
  clientOverride = next;
  for (const existing of getApps()) {
    void deleteApp(existing);
  }
  app = undefined;
  auth = undefined;
  db = undefined;
}

export function hasFirebaseClientConfig(): boolean {
  return resolveConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = resolveConfig();
  if (!config) return null;
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!auth) auth = getAuth(a);
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!db) db = getFirestore(a);
  return db;
}
