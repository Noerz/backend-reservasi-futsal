import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getDocumentation(): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Presensi - Dokumentasi</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #1a202c;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }
    
    .logo {
      font-size: 4rem;
      margin-bottom: 20px;
    }
    
    header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    header p {
      font-size: 1.2rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .version-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-top: 15px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: -40px 20px 40px;
      position: relative;
      z-index: 10;
    }
    
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
    }
    
    .stat-label {
      color: #718096;
      font-size: 0.9rem;
      margin-top: 5px;
    }
    
    .main-content {
      background: #f7fafc;
      border-radius: 30px 30px 0 0;
      padding: 40px 20px;
      min-height: 60vh;
    }
    
    .section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.4rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .section-icon {
      font-size: 1.5rem;
    }
    
    .endpoint-group {
      margin-bottom: 25px;
    }
    
    .endpoint-group-title {
      font-size: 1rem;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .endpoint {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      background: #f7fafc;
      border-radius: 10px;
      margin-bottom: 8px;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    
    .endpoint:hover {
      background: #edf2f7;
      border-color: #e2e8f0;
    }
    
    .method {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      margin-right: 12px;
      min-width: 60px;
      text-align: center;
    }
    
    .method.get { background: #c6f6d5; color: #276749; }
    .method.post { background: #bee3f8; color: #2c5282; }
    .method.put { background: #fefcbf; color: #975a16; }
    .method.delete { background: #fed7d7; color: #c53030; }
    
    .endpoint-path {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.9rem;
      color: #4a5568;
      flex: 1;
    }
    
    .endpoint-desc {
      font-size: 0.85rem;
      color: #718096;
      margin-left: auto;
      padding-left: 15px;
    }
    
    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .tech-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #4a5568;
      border: 1px solid #e2e8f0;
    }
    
    .tech-badge img {
      width: 20px;
      height: 20px;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .feature-card {
      padding: 20px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .feature-card h4 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      color: #2d3748;
      margin-bottom: 8px;
    }
    
    .feature-card p {
      font-size: 0.9rem;
      color: #718096;
      line-height: 1.5;
    }
    
    .auth-note {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 15px 20px;
      background: linear-gradient(135deg, #fef5e7 0%, #fef3c7 100%);
      border-radius: 12px;
      border-left: 4px solid #f6ad55;
      margin-top: 20px;
    }
    
    .auth-note-icon {
      font-size: 1.2rem;
    }
    
    .auth-note-content h4 {
      font-size: 0.95rem;
      color: #975a16;
      margin-bottom: 5px;
    }
    
    .auth-note-content p {
      font-size: 0.85rem;
      color: #744210;
      line-height: 1.5;
    }
    
    .code-block {
      background: #2d3748;
      color: #e2e8f0;
      padding: 15px 20px;
      border-radius: 10px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      margin-top: 15px;
    }
    
    .code-block .keyword { color: #f687b3; }
    .code-block .string { color: #68d391; }
    .code-block .comment { color: #718096; }
    
    footer {
      text-align: center;
      padding: 30px 20px;
      color: #718096;
      font-size: 0.9rem;
    }
    
    footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    @media (max-width: 768px) {
      header h1 { font-size: 1.8rem; }
      header p { font-size: 1rem; }
      .endpoint { flex-wrap: wrap; }
      .endpoint-desc { 
        width: 100%; 
        margin-left: 72px; 
        margin-top: 5px;
        padding-left: 0;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">🏢</div>
    <h1>API Presensi</h1>
    <p>Backend sistem presensi digital berbasis QR Code untuk pemerintahan desa</p>
    <span class="version-badge">v1.0.0 • RESTful API</span>
  </header>
  
  <div class="container">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📡</div>
        <div class="stat-value">25+</div>
        <div class="stat-label">Endpoints</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔐</div>
        <div class="stat-value">JWT</div>
        <div class="stat-label">Authentication</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📱</div>
        <div class="stat-value">QR</div>
        <div class="stat-label">Code Based</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🗄️</div>
        <div class="stat-value">MySQL</div>
        <div class="stat-label">Database</div>
      </div>
    </div>
  </div>
  
  <div class="main-content">
    <div class="container">
      
      <!-- Features Section -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">✨</span>
          Fitur Utama
        </h2>
        <div class="features-grid">
          <div class="feature-card">
            <h4>📍 Lokasi GPS</h4>
            <p>Validasi presensi berdasarkan koordinat GPS dan radius lokasi kerja</p>
          </div>
          <div class="feature-card">
            <h4>📲 QR Code Dinamis</h4>
            <p>Generate QR code dengan waktu validitas dan dapat di-regenerate</p>
          </div>
          <div class="feature-card">
            <h4>👥 Multi Role</h4>
            <p>Dukungan untuk User biasa dan Admin dengan akses berbeda</p>
          </div>
          <div class="feature-card">
            <h4>📊 Statistik</h4>
            <p>Dashboard statistik kehadiran lengkap untuk monitoring</p>
          </div>
          <div class="feature-card">
            <h4>🔒 Keamanan</h4>
            <p>JWT authentication dengan bcrypt password hashing</p>
          </div>
          <div class="feature-card">
            <h4>📜 Riwayat</h4>
            <p>Pencatatan lengkap riwayat check-in dan check-out</p>
          </div>
        </div>
      </div>
      
      <!-- Auth Endpoints -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">🔐</span>
          Authentication
        </h2>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">👤 User Authentication</div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/auth/register</span>
            <span class="endpoint-desc">Registrasi user baru</span>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/auth/login</span>
            <span class="endpoint-desc">Login user</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/auth/profile</span>
            <span class="endpoint-desc">Get profile user 🔒</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">🛡️ Admin Authentication</div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/auth/admin/register</span>
            <span class="endpoint-desc">Registrasi admin baru</span>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/auth/admin/login</span>
            <span class="endpoint-desc">Login admin</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/auth/admin/profile</span>
            <span class="endpoint-desc">Get profile admin 🔒</span>
          </div>
        </div>
        
        <div class="auth-note">
          <span class="auth-note-icon">💡</span>
          <div class="auth-note-content">
            <h4>Autentikasi</h4>
            <p>Semua endpoint dengan tanda 🔒 memerlukan header <code>Authorization: Bearer &lt;token&gt;</code></p>
          </div>
        </div>
      </div>
      
      <!-- User Endpoints -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">📍</span>
          User Attendance
        </h2>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">🏢 Lokasi</div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/attendance/locations</span>
            <span class="endpoint-desc">List semua lokasi aktif</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/attendance/locations/:id</span>
            <span class="endpoint-desc">Detail lokasi</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">📲 QR Code</div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/attendance/qr/active</span>
            <span class="endpoint-desc">List QR code aktif 🔒</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/attendance/qr/image/:qrCodeId</span>
            <span class="endpoint-desc">Get gambar QR code 🔒</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">✅ Presensi</div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/attendance/check-in</span>
            <span class="endpoint-desc">Check-in dengan QR 🔒</span>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/attendance/check-out</span>
            <span class="endpoint-desc">Check-out 🔒</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/attendance/my</span>
            <span class="endpoint-desc">Presensi hari ini 🔒</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/attendance/my/history</span>
            <span class="endpoint-desc">Riwayat presensi 🔒</span>
          </div>
        </div>
      </div>
      
      <!-- Admin Endpoints -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">🛡️</span>
          Admin Endpoints
        </h2>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">📍 Kelola Lokasi</div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/admin/locations</span>
            <span class="endpoint-desc">Buat lokasi baru</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/locations</span>
            <span class="endpoint-desc">List semua lokasi</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/locations/:id</span>
            <span class="endpoint-desc">Detail lokasi</span>
          </div>
          <div class="endpoint">
            <span class="method put">PUT</span>
            <span class="endpoint-path">/api/v1/admin/locations/:id</span>
            <span class="endpoint-desc">Update lokasi</span>
          </div>
          <div class="endpoint">
            <span class="method delete">DELETE</span>
            <span class="endpoint-path">/api/v1/admin/locations/:id</span>
            <span class="endpoint-desc">Hapus lokasi</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">📲 Kelola QR Code</div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/admin/qr/generate</span>
            <span class="endpoint-desc">Generate QR baru</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/qr</span>
            <span class="endpoint-desc">List semua QR</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/qr/active</span>
            <span class="endpoint-desc">List QR aktif</span>
          </div>
          <div class="endpoint">
            <span class="method put">PUT</span>
            <span class="endpoint-path">/api/v1/admin/qr/:id/deactivate</span>
            <span class="endpoint-desc">Nonaktifkan QR</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">👥 Kelola User</div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/users</span>
            <span class="endpoint-desc">List semua user</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/users/:id</span>
            <span class="endpoint-desc">Detail user</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">📊 Presensi & Statistik</div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/attendances</span>
            <span class="endpoint-desc">List semua presensi</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/attendances/statistics</span>
            <span class="endpoint-desc">Statistik presensi</span>
          </div>
        </div>
        
        <div class="endpoint-group">
          <div class="endpoint-group-title">🎭 Kelola Role</div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/v1/admin/roles</span>
            <span class="endpoint-desc">Buat role baru</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/roles</span>
            <span class="endpoint-desc">List semua role</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/v1/admin/roles/:id</span>
            <span class="endpoint-desc">Detail role</span>
          </div>
          <div class="endpoint">
            <span class="method put">PUT</span>
            <span class="endpoint-path">/api/v1/admin/roles/:id</span>
            <span class="endpoint-desc">Update role</span>
          </div>
          <div class="endpoint">
            <span class="method delete">DELETE</span>
            <span class="endpoint-path">/api/v1/admin/roles/:id</span>
            <span class="endpoint-desc">Hapus role</span>
          </div>
        </div>
        
        <div class="auth-note">
          <span class="auth-note-icon">⚠️</span>
          <div class="auth-note-content">
            <h4>Admin Only</h4>
            <p>Semua endpoint di bagian Admin memerlukan token admin. Token user biasa tidak akan diterima.</p>
          </div>
        </div>
      </div>
      
      <!-- Tech Stack -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">🛠️</span>
          Tech Stack
        </h2>
        <div class="tech-stack">
          <div class="tech-badge">
            <span>🟢</span> NestJS 11
          </div>
          <div class="tech-badge">
            <span>🔷</span> TypeScript
          </div>
          <div class="tech-badge">
            <span>🔺</span> Prisma ORM
          </div>
          <div class="tech-badge">
            <span>🐬</span> MySQL / MariaDB
          </div>
          <div class="tech-badge">
            <span>🔐</span> JWT Auth
          </div>
          <div class="tech-badge">
            <span>🔒</span> Bcrypt
          </div>
          <div class="tech-badge">
            <span>📲</span> QRCode Generator
          </div>
          <div class="tech-badge">
            <span>✅</span> Class Validator
          </div>
        </div>
      </div>
      
      <!-- Quick Start -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">🚀</span>
          Quick Start
        </h2>
        <p style="color: #718096; margin-bottom: 15px;">Contoh request untuk login dan mendapatkan token:</p>
        <div class="code-block">
<span class="comment">// POST /api/v1/auth/login</span>
{
  <span class="string">"email"</span>: <span class="string">"user@example.com"</span>,
  <span class="string">"password"</span>: <span class="string">"password123"</span>
}

<span class="comment">// Response</span>
{
  <span class="string">"status"</span>: <span class="string">"success"</span>,
  <span class="string">"message"</span>: <span class="string">"Login berhasil"</span>,
  <span class="string">"data"</span>: {
    <span class="string">"user"</span>: { ... },
    <span class="string">"access_token"</span>: <span class="string">"eyJhbGciOiJIUzI1..."</span>
  }
}
        </div>
      </div>
      
    </div>
  </div>
  
  <footer>
    <p>🏢 Backend Presensi &copy; ${new Date().getFullYear()} • Built with ❤️ using NestJS</p>
    <p style="margin-top: 10px;">Server: <strong>${baseUrl}</strong></p>
  </footer>
</body>
</html>
    `;
  }
}
