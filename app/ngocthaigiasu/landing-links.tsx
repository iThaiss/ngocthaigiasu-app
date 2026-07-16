'use client'

import Image from 'next/image'
import { ArrowUpRight, Check, Copy, ExternalLink, QrCode, Share2, Sparkles, X } from 'lucide-react'
import { SiFacebook, SiYoutube, SiZalo } from 'react-icons/si'
import { useEffect, useState } from 'react'
import styles from './landing.module.css'

const links = {
  zaloGroup: 'https://zalo.me/g/9c8n1hgb0zul5pbislww',
  youtube: 'https://www.youtube.com/@ngocthaigiasu',
  facebook: 'https://www.facebook.com/ngocthaigiasu',
  website: 'https://ngocthaigiasu.id.vn',
}

type LinkKey = 'zalo_group' | 'youtube' | 'facebook' | 'learning_website' | 'personal_zalo_qr' | 'share'

function trackClick(linkKey: LinkKey) {
  void fetch('/api/landing-clicks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkKey }),
    keepalive: true,
  }).catch(() => undefined)
}

const sparkles = [
  { left: '7%', top: '11%', delay: '0s' },
  { left: '20%', top: '72%', delay: '1.1s' },
  { left: '51%', top: '9%', delay: '.5s' },
  { left: '76%', top: '19%', delay: '1.8s' },
  { left: '91%', top: '63%', delay: '.8s' },
  { left: '42%', top: '86%', delay: '2.3s' },
]

export function LandingLinks() {
  const [qrOpen, setQrOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!qrOpen) return
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setQrOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [qrOpen])

  const sharePage = async () => {
    trackClick('share')
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Học Toán 12 cùng anh Thái',
          text: 'Nhóm học Toán 12 dành cho các bạn đang yếu hoặc mất gốc nè!',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      // Người dùng có thể đóng bảng chia sẻ.
    }
  }

  const openQr = () => {
    trackClick('personal_zalo_qr')
    setQrOpen(true)
  }

  return (
    <main className={styles.page}>
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.doodleLayer} aria-hidden="true">
        <span className={styles.doodleFormula}>y = ax² + bx + c</span>
        <span className={styles.doodleCircle}>x² + y² = R²</span>
        <span className={styles.doodleTriangle}>△ ABC</span>
        <span className={styles.doodleHeart}>♡ Toán 12</span>
        <span className={styles.doodleScore}>✦ 10 điểm ✦</span>
        <span className={styles.doodleWave}>∿ ∿ ∿</span>
        <span className={styles.doodlePencil}>✎</span>
      </div>
      {sparkles.map((sparkle, index) => (
        <span
          className={styles.sparkle}
          style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay }}
          key={index}
          aria-hidden="true"
        >✦</span>
      ))}
      <span className={`${styles.floatingMath} ${styles.mathOne}`} aria-hidden="true">∫ f(x)dx</span>
      <span className={`${styles.floatingMath} ${styles.mathTwo}`} aria-hidden="true">lim x→∞</span>
      <span className={`${styles.floatingMath} ${styles.mathThree}`} aria-hidden="true">a² + b²</span>

      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Điều hướng nhanh">
          <a href={links.website} className={styles.logoLink} aria-label="Trang chủ Ngọc Thái Gia Sư">
            <span className={styles.logoTape} aria-hidden="true" />
            <Image src="/logo.png" width={289} height={98} alt="Ngọc Thái Gia Sư" priority />
          </a>
          <button type="button" className={styles.shareButton} onClick={sharePage}>
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            <span>{copied ? 'Đã copy' : 'Chia sẻ'}</span>
          </button>
        </nav>

        <section className={styles.heroCard}>
          <div className={styles.spiral} aria-hidden="true">
            {Array.from({ length: 10 }).map((_, index) => <i key={index} />)}
          </div>
          <div className={styles.marginLine} aria-hidden="true" />
          <span className={styles.tape} aria-hidden="true" />

          <div className={styles.heroCopy}>
            <span className={styles.handNote}>Toán 12 không đáng sợ đâu! ツ</span>
            <h1>Hello các bạn,<br /><span>anh là Thái!</span></h1>
            <p>
              Anh chỉ có một mong muốn nhỏ thôi: giúp các bạn hiểu trọn vẹn Toán 12 để tự tin bước một chân vào cánh cổng đại học. Nếu em cần một người đồng hành trong chặng đường sắp tới, anh luôn sẵn sàng.
            </p>
            <div className={styles.heroActions}>
              <a
                href={links.zaloGroup}
                target="_blank"
                rel="noreferrer"
                className={styles.zaloButton}
                onClick={() => trackClick('zalo_group')}
              >
                <SiZalo size={28} />
                <span><b>Vào nhóm học chung</b><small>350+ bạn đang ở trong nhóm</small></span>
                <ArrowUpRight size={21} />
              </a>
              <button type="button" className={styles.qrShortcut} onClick={openQr} aria-label="Mở mã QR Zalo của anh Thái">
                <QrCode size={22} />
              </button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.yellowBlob} aria-hidden="true" />
            <span className={styles.doodleArrow} aria-hidden="true">↝</span>
            <span className={styles.doodleLabel}>Anh Thái nè!</span>
            <Image
              src="/thai-portrait.png"
              alt="Anh Thái - gia sư Toán 12"
              width={810}
              height={1254}
              priority
              className={styles.portrait}
            />
            <div className={styles.priceNote}>
              <span>HỌC PHÍ</span>
              <strong>6K</strong>
              <b>/ buổi</b>
              <i>rẻ hơn ly trà đá ✨</i>
            </div>
          </div>
        </section>

        <section className={styles.promiseRow} aria-label="Thông tin lớp học">
          <div><span>01</span><p><b>Dành cho bạn yếu Toán</b><small>Học lại từ gốc, không ngại hỏi</small></p></div>
          <div><span>02</span><p><b>Tập trung đúng Toán 12</b><small>Bám sát mục tiêu thi đại học</small></p></div>
          <div><span>03</span><p><b>Chỉ 6.000đ mỗi buổi</b><small>Học nhẹ ví, đỡ áp lực hơn</small></p></div>
        </section>

        <section className={styles.linksSection} aria-labelledby="links-heading">
          <div className={styles.sectionTitle}>
            <span>LINK CỦA ANH Ở ĐÂY</span>
            <h2 id="links-heading">Em cần gì thì <mark>bấm vào nhé!</mark></h2>
            <i aria-hidden="true">⌁⌁⌁</i>
          </div>

          <div className={styles.bentoGrid}>
            <a
              className={`${styles.bentoCard} ${styles.zaloCard}`}
              href={links.zaloGroup}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick('zalo_group')}
            >
              <span className={styles.brandIcon}><SiZalo /></span>
              <span className={styles.cardCopy}>
                <small>ƯU TIÊN VÀO ĐÂY TRƯỚC</small>
                <strong>Nhóm Zalo học Toán 12</strong>
                <p>Hỏi bài, nhận tài liệu và học cùng hơn 350 bạn khác.</p>
              </span>
              <span className={styles.openIcon}><ArrowUpRight /></span>
              <span className={styles.memberSticker}>350+<small>thành viên</small></span>
            </a>

            <a
              className={`${styles.bentoCard} ${styles.youtubeCard}`}
              href={links.youtube}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick('youtube')}
            >
              <span className={styles.brandIcon}><SiYoutube /></span>
              <span className={styles.cardCopy}>
                <small>XEM BÀI GIẢNG</small>
                <strong>YouTube</strong>
                <p>Video Toán 12 anh làm cho các bạn nè.</p>
              </span>
              <ArrowUpRight className={styles.cornerArrow} />
            </a>

            <a
              className={`${styles.bentoCard} ${styles.facebookCard}`}
              href={links.facebook}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick('facebook')}
            >
              <span className={styles.brandIcon}><SiFacebook /></span>
              <span className={styles.cardCopy}>
                <small>THEO DÕI ANH</small>
                <strong>Facebook</strong>
                <p>Cập nhật lịch học và nội dung mới.</p>
              </span>
              <ArrowUpRight className={styles.cornerArrow} />
            </a>

            <a
              className={`${styles.bentoCard} ${styles.webCard}`}
              href={links.website}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick('learning_website')}
            >
              <span className={styles.ntgsLogo}>
                <Image src="/square-logo.png" alt="" width={62} height={62} />
              </span>
              <span className={styles.cardCopy}>
                <small>HỌC VÀ LUYỆN TẬP</small>
                <strong>Website học tập</strong>
                <p>Vào học bài, làm đề và luyện tập ngay trên web.</p>
              </span>
              <ExternalLink className={styles.cornerArrow} />
            </a>

            <button type="button" className={`${styles.bentoCard} ${styles.personalCard}`} onClick={openQr}>
              <span className={styles.qrMini}>
                <Image src="/zalo-nguyen-thai-qr.png" alt="" width={160} height={240} />
              </span>
              <span className={styles.cardCopy}>
                <small>CẦN NHẮN RIÊNG?</small>
                <strong>Zalo cá nhân của anh</strong>
                <p>Bấm vào đây để mở to mã QR rồi quét nhé.</p>
              </span>
              <QrCode className={styles.cornerArrow} />
            </button>
          </div>
        </section>

        <section className={styles.lastNote}>
          <Sparkles aria-hidden="true" />
          <p><span>Note nhỏ:</span> Yếu Toán không có nghĩa là em không học được Toán. Có thể em chỉ chưa gặp đúng cách giải thích thôi.</p>
          <a href={links.zaloGroup} target="_blank" rel="noreferrer" onClick={() => trackClick('zalo_group')}>
            Học cùng anh nhé <ArrowUpRight size={18} />
          </a>
        </section>

        <footer className={styles.footer}>
          <Image src="/square-logo.png" alt="" width={32} height={32} />
          <span>Ngọc Thái Gia Sư · Toán 12 cho người cần học lại từ đầu</span>
        </footer>
      </div>

      <a
        className={styles.mobileZalo}
        href={links.zaloGroup}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackClick('zalo_group')}
      >
        <SiZalo size={25} /><b>Vào nhóm học chung</b><span>6K/buổi</span>
      </a>

      {qrOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setQrOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="qr-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setQrOpen(false)} aria-label="Đóng mã QR"><X /></button>
            <span className={styles.modalTape} aria-hidden="true" />
            <small>ZALO CÁ NHÂN</small>
            <h2 id="qr-title">Kết bạn với anh Thái</h2>
            <p>Mở Zalo → chọn biểu tượng quét QR → đưa camera vào mã này nhé.</p>
            <div className={styles.qrFrame}>
              <Image src="/zalo-nguyen-thai-qr.png" alt="Mã QR Zalo cá nhân của anh Thái" width={1254} height={1880} />
            </div>
            <div className={styles.copyHint}><Copy size={15} /> Chạm giữ ảnh nếu em muốn lưu mã</div>
          </section>
        </div>
      )}
    </main>
  )
}
