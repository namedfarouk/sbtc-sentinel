;; sBTC Sentinel - On-Chain Sentiment Oracle
;; Stores AI-analyzed Bitcoin/sBTC sentiment snapshots on Stacks

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-SCORE (err u101))
(define-constant ERR-NO-DATA (err u102))

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var snapshot-count uint u0)
(define-data-var latest-score uint u50)
(define-data-var latest-label (string-ascii 20) "neutral")
(define-data-var last-updated uint u0)

;; =====================
;; DATA MAPS
;; =====================

(define-map sentiment-snapshots
  { id: uint }
  {
    score: uint,
    label: (string-ascii 20),
    btc-price: uint,
    sbtc-tvl: uint,
    block-height: uint,
    source: (string-ascii 50)
  }
)

(define-map authorized-updaters
  { updater: principal }
  { active: bool }
)

;; =====================
;; AUTHORIZATION
;; =====================

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-authorized)
  (or
    (is-owner)
    (default-to false (get active (map-get? authorized-updaters { updater: tx-sender })))
  )
)

(define-public (add-updater (updater principal))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (ok (map-set authorized-updaters { updater: updater } { active: true }))
  )
)

(define-public (remove-updater (updater principal))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (ok (map-set authorized-updaters { updater: updater } { active: false }))
  )
)

;; =====================
;; CORE FUNCTIONS
;; =====================

(define-public (submit-sentiment
    (score uint)
    (label (string-ascii 20))
    (btc-price uint)
    (sbtc-tvl uint)
    (source (string-ascii 50))
  )
  (let
    (
      (current-id (var-get snapshot-count))
    )
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (<= score u100) ERR-INVALID-SCORE)

    (map-set sentiment-snapshots
      { id: current-id }
      {
        score: score,
        label: label,
        btc-price: btc-price,
        sbtc-tvl: sbtc-tvl,
        block-height: stacks-block-height,
        source: source
      }
    )

    (var-set latest-score score)
    (var-set latest-label label)
    (var-set last-updated stacks-block-height)
    (var-set snapshot-count (+ current-id u1))

    (ok current-id)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (get-latest-sentiment)
  (ok {
    score: (var-get latest-score),
    label: (var-get latest-label),
    last-updated: (var-get last-updated),
    total-snapshots: (var-get snapshot-count)
  })
)

(define-read-only (get-snapshot (id uint))
  (match (map-get? sentiment-snapshots { id: id })
    snapshot (ok snapshot)
    ERR-NO-DATA
  )
)

(define-read-only (get-snapshot-count)
  (ok (var-get snapshot-count))
)

(define-read-only (is-updater (updater principal))
  (ok (default-to false (get active (map-get? authorized-updaters { updater: updater }))))
)