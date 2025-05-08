
---

````markdown
# 🧩 Node.js REST API with MongoDB, Docker & Elasticsearch

Bu proje; **Node.js**, **Express**, **MongoDB**, **Docker** ve **Elasticsearch** kullanarak geliştirilmiş kapsamlı bir **blog gönderisi ve kullanıcı yönetimi API'sidir**. Kullanıcı kaydı, JWT tabanlı kimlik doğrulama, gönderi yönetimi, veri doğrulama, loglama ve Elasticsearch senkronizasyonu gibi modern backend bileşenlerini içerir.

---

## 📋 Temel Özellikler

| Özellik               | Açıklama                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| **Kullanıcı Yönetimi** | Kayıt, JWT ile oturum açma, kullanıcı profillerini görüntüleme/güncelleme/silme |
| **Gönderi Yönetimi**  | CRUD işlemleri, kullanıcı ve etiket bazlı filtreleme
| **Veri Doğrulama**    | `express-validator` ile giriş doğrulama ve hata standardizasyonu |
| **Loglama**           | `winston` ile detaylı dosya ve konsol logları |
| **Docker Desteği**    | Docker Compose ile konteynerleştirilmiş yapı |
| **Elasticsearch**     | Verilerde tam metin arama ve hızlı sorgulama |
| **Kibana Entegrasyonu** | Arayüz üzerinden veri analizi ve görselleştirme |
| **Cron Görevleri**    | Otomatik senkronizasyon işlemleri için zamanlanmış görevler |

---

## 🛠️ Kullanılan Teknolojiler

| Teknoloji         | Açıklama                                       |
|-------------------|------------------------------------------------|
| Node.js           | JavaScript çalışma zamanı ortamı              |
| Express           | Minimal ve esnek web framework'ü              |
| MongoDB           | NoSQL veritabanı                              |
| Mongoose          | MongoDB için ODM (Object Data Modeling)       |
| JWT               | JSON Web Token ile kimlik doğrulama           |
| bcryptjs          | Güvenli parola hashleme                       |
| express-validator | Giriş doğrulama ve sanitizasyon                |
| Winston           | Gelişmiş loglama altyapısı                    |
| Docker            | Konteynerleştirme çözümü                      |
| Docker Compose    | Çoklu konteyner yönetimi                      |
| Elasticsearch     | Arama motoru                                  |
| Kibana            | Elasticsearch verilerini görselleştirme aracı |

---

## 🚀 Başlarken

### Gereksinimler

| Araç             | Bağlantı                                                   |
|------------------|------------------------------------------------------------|
| Docker           | [Docker'ı İndir](https://www.docker.com/get-started)       |
| Docker Compose   | [Docker Compose Kurulumu](https://docs.docker.com/compose/install/) |

---

## ⚙️ Kurulum Adımları

```bash
# 1. Depoyu klonlayın
git clone https://github.com/rumeysa111/nodejs-user-post-api.git

# 2. Docker konteynerlerini başlatın
docker-compose up
````

* Uygulama: [http://localhost:3000](http://localhost:3000)
* Kibana: [http://localhost:5601](http://localhost:5601)

---

## 🔧 Çevre Değişkenleri (.env)

| Değişken    | Açıklama                          |
| ----------- | --------------------------------- |
| PORT        | Sunucu portu (varsayılan: 3000)   |
| MONGO\_URI  | MongoDB bağlantı dizesi           |
| JWT\_SECRET | JWT oluşturmak için gizli anahtar |

---

## 🔐 Kimlik Doğrulama

### Yeni Kullanıcı Kaydı

```json
POST /api/users/register
{
  "username": "example",
  "email": "example@example.com",
  "password": "password123",
  "role": "user" // Opsiyonel
}
```

### Giriş

```json
POST /api/users/login
{
  "email": "example@example.com",
  "password": "password123"
}
```

**Yanıt:**

```json
{
  "token": "JWT_TOKEN",
  "userId": "USER_ID"
}
```

---

## 👥 Kullanıcı ve Gönderi API'leri

### Kullanıcı Uç Noktaları

| Metot  | Uç Nokta        | Açıklama                | Yetki   |
| ------ | --------------- | ----------------------- | ------- |
| GET    | /api/users      | Tüm kullanıcıları getir | Yok     |
| GET    | /api/users/\:id | ID ile kullanıcı getir  | Yok     |
| PUT    | /api/users/\:id | Kullanıcıyı güncelle    | Gerekli |
| DELETE | /api/users/\:id | Kullanıcıyı sil         | Gerekli |

### Gönderi Uç Noktaları

| Metot  | Uç Nokta             | Açıklama                   | Yetki          |
| ------ | -------------------- | -------------------------- | -------------- |
| POST   | /api/posts/create    | Yeni gönderi oluştur       | Gerekli        |
| GET    | /api/posts           | Tüm gönderileri getir      | Yok            |
| GET    | /api/posts/user/\:id | Kullanıcıya ait gönderiler | Yok            |
| GET    | /api/posts/tag/\:tag | Etikete göre filtreleme    | Yok            |
| PUT    | /api/posts/\:id      | Gönderiyi güncelle         | Gönderi Sahibi |
| DELETE | /api/posts/\:id      | Gönderiyi sil              | Gönderi Sahibi |

---

## 🐳 Docker Ortamı

| Servis        | Port  | Açıklama                      |
| ------------- | ----- | ----------------------------- |
| api           | 3000  | Node.js Express API           |
| mongo\_db     | 27017 | MongoDB veritabanı            |
| elasticsearch | 9200  | Arama motoru                  |
| kibana        | 5601  | Elasticsearch yönetim arayüzü |

---

## 🔍 Elasticsearch & Kibana

### Özellikler

* Tam metin arama
* Etiket, içerik, kullanıcıya göre filtreleme
* Kibana ile veri görselleştirme ve keşif

### Senkronizasyon API’leri

| Uç Nokta             | Açıklama                                  |
| -------------------- | ----------------------------------------- |
| POST /api/sync/users | Tüm kullanıcıları Elasticsearch'e aktarır |
| POST /api/sync/posts | Tüm gönderileri Elasticsearch'e aktarır   |

### Cron Görevleri

| Görev          | Zamanlama        |
| -------------- | ---------------- |
| Kullanıcı Sync | Her 4 saatte bir |
| Gönderi Sync   | Her 2 saatte bir |

---

## 🧪 Postman Testleri

1. Postman’i indirip açın: [https://www.postman.com/downloads](https://www.postman.com/downloads)
2. `postman_collections` klasöründeki JSON dosyalarını import edin
3. JWT token aldıktan sonra "Authorization" sekmesinde Bearer Token olarak kullanın

---

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Ayrıntılar için `LICENSE` dosyasına göz atabilirsiniz.


