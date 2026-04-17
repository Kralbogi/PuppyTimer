import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          <Shield size={20} className="text-orange-500" />
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Gizlilik Politikası
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
            1. Topladığımız Veriler
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            PawLand uygulaması aşağıdaki verileri toplamaktadır:
          </p>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li>Hesap oluşturmak için e-posta adresi</li>
            <li>Köpek profil bilgileri (ad, cins, doğum tarihi, fotoğraf)</li>
            <li>Köpek sağlık ve bakım kayıtları (beslenme, yürüyüş, tuvalet, sağlık notları)</li>
            <li>Konum bilgisi (yalnızca topluluk haritası özelliği kullanıldığında ve izin verildiğinde)</li>
            <li>Uygulama içi satın alma geçmişi</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            2. Verilerin Kullanımı
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Topladığımız veriler yalnızca şu amaçlarla kullanılır:
          </p>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li>Uygulama özelliklerini sunmak ve geliştirmek</li>
            <li>Köpek bakım takibini kişiselleştirmek</li>
            <li>Yapay zeka destekli analizler sunmak (yalnızca Premium kullanıcılar)</li>
            <li>Topluluk haritasında köpekleri göstermek (yalnızca izin verildiğinde)</li>
            <li>Teknik destek sağlamak</li>
          </ul>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Verileriniz üçüncü şahıslara satılmaz veya reklam amaçlı kullanılmaz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            3. Verilerin Saklanması
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Verileriniz Google Firebase altyapısında güvenli biçimde saklanır. Hesabınızı
            sildiğinizde tüm kişisel verileriniz kalıcı olarak silinir. Yerel cihaz verileri
            (IndexedDB) yalnızca cihazınızda tutulur.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            4. Konum Verisi
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Konum bilgisi yalnızca "Topluluk Haritası" özelliğini kullandığınızda ve açıkça
            izin verdiğinizde toplanır. İzninizi istediğiniz zaman cihaz ayarlarından
            geri alabilirsiniz. Konum verisi hiçbir zaman pazarlama amacıyla kullanılmaz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            5. Çerezler ve Yerel Depolama
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Uygulama, kimlik doğrulama ve tercih kaydetme amacıyla çerezler ve tarayıcı
            yerel depolama alanı kullanır. Bu veriler yalnızca uygulamanın çalışması için
            gereklidir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            6. Üçüncü Taraf Hizmetler
          </h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li><strong>Firebase (Google):</strong> Kimlik doğrulama ve veri depolama</li>
            <li><strong>Stripe:</strong> Güvenli ödeme işleme</li>
            <li><strong>Anthropic Claude:</strong> Yapay zeka analizi (yalnızca Premium)</li>
          </ul>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Bu hizmetlerin kendi gizlilik politikaları geçerlidir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            7. Haklarınız (KVKK / GDPR)
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Kişisel verileriniz üzerinde aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-5" style={{ color: 'var(--color-text-muted)' }}>
            <li>Verilerinize erişim talep etme</li>
            <li>Verilerinizi düzeltme veya silme</li>
            <li>Veri işlemeye itiraz etme</li>
            <li>Verilerinizi taşıma talep etme</li>
          </ul>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Talepleriniz için: <strong>destek@pawland.app</strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            8. İletişim
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Gizlilik politikamız hakkında sorularınız için:{' '}
            <strong>destek@pawland.app</strong>
          </p>
        </section>
      </div>
    </div>
  )
}
