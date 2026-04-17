import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsOfServicePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-orange-500" />
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Kullanım Koşulları
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Son güncelleme: 8 Nisan 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            1. Kabul
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            PawLand uygulamasını kullanarak bu Kullanım Koşulları'nı kabul etmiş olursunuz.
            Bu koşulları kabul etmiyorsanız lütfen uygulamayı kullanmayınız.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            2. Hizmet Tanımı
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            PawLand, köpek sahiplerine köpeklerinin bakımını takip etme, sağlık kayıtlarını
            yönetme ve topluluk özellikleriyle diğer köpek sahipleriyle etkileşim kurma
            imkânı sunan bir mobil/web uygulamasıdır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            3. Hesap Oluşturma
          </h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li>Hesap oluşturmak için en az 13 yaşında olmanız gerekmektedir.</li>
            <li>Hesap bilgilerinizin doğru ve güncel olmasından siz sorumlusunuz.</li>
            <li>Hesap güvenliğinizi korumak sizin sorumluluğunuzdadır.</li>
            <li>Her kullanıcı yalnızca bir hesap oluşturabilir.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            4. Kullanım Kuralları
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Aşağıdaki davranışlar kesinlikle yasaktır:
          </p>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li>Yanıltıcı veya sahte içerik paylaşmak</li>
            <li>Diğer kullanıcılara hakaret etmek veya taciz etmek</li>
            <li>Spam, reklam veya zararlı içerik göndermek</li>
            <li>Uygulamayı kötüye kullanmak veya güvenlik açıklarını istismar etmek</li>
            <li>Başkalarının hesap bilgilerine erişmeye çalışmak</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            5. Premium Abonelik
          </h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li>Premium abonelik aylık veya yıllık olarak sunulmaktadır.</li>
            <li>Abonelik, iptal edilmediği sürece otomatik olarak yenilenir.</li>
            <li>İptal işlemi mevcut dönem sonunda geçerli olur, para iadesi yapılmaz.</li>
            <li>Premium özellikler önceden haber verilmeksizin değiştirilebilir.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            6. Mağaza ve Satın Almalar
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Uygulama içi mağazadan yapılan alışverişler Stripe üzerinden güvenli biçimde
            işlenir. Ürün teslimatı satıcı tarafından gerçekleştirilir; PawLand yalnızca
            aracı platform görevi görür. İade ve değişim talepleri için satıcıyla iletişime
            geçiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            7. İçerik Mülkiyeti
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Uygulamaya yüklediğiniz fotoğraflar ve içerikler size aittir. Bu içerikleri
            uygulamada göstermek için PawLand'e sınırlı, geri alınabilir bir lisans
            vermiş olursunuz. Hesabınızı sildiğinizde bu lisans sona erer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            8. Sorumluluk Sınırlaması
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            PawLand, uygulamada sağlanan veterinerlik veya sağlık bilgilerinin
            doğruluğundan sorumlu tutulamaz. Bu bilgiler yalnızca genel rehberlik amaçlıdır;
            profesyonel veteriner tavsiyesinin yerini tutmaz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            9. Hesap Kapatma
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Bu koşulları ihlal eden hesaplar önceden bildirim yapılmaksızın kapatılabilir.
            Hesabınızı kendiniz kapatmak için destek@pawland.app adresine yazabilirsiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            10. Değişiklikler
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya
            uygulama bildirimi ile duyurulacaktır. Uygulamayı kullanmaya devam etmeniz
            güncel koşulları kabul ettiğiniz anlamına gelir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            11. İletişim
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Kullanım koşullarına ilişkin sorularınız için:{' '}
            <strong>destek@pawland.app</strong>
          </p>
        </section>
      </div>
    </div>
  )
}
