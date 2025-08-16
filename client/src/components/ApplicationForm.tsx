import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { CheckCircle, FileText, User, Home, Heart } from 'lucide-react';
import type { CreateApplicationInput } from '../../../server/src/schema';

export function ApplicationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [formData, setFormData] = useState<CreateApplicationInput>({
    full_name: '',
    nik: '',
    place_of_birth: '',
    date_of_birth: new Date(),
    gender: 'LAKI_LAKI',
    marital_status: 'BELUM_MENIKAH',
    phone: '',
    email: '',
    address: '',
    village: '',
    district: '',
    assistance_category: 'BANTUAN_SOSIAL',
    assistance_type: '',
    reason: '',
    family_members_count: 1,
    monthly_income_range: 'KURANG_DARI_1JT'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createApplication.mutate(formData);
      setTrackingNumber(response.tracking_number);
      setSubmitted(true);
      // Reset form
      setFormData({
        full_name: '',
        nik: '',
        place_of_birth: '',
        date_of_birth: new Date(),
        gender: 'LAKI_LAKI',
        marital_status: 'BELUM_MENIKAH',
        phone: '',
        email: '',
        address: '',
        village: '',
        district: '',
        assistance_category: 'BANTUAN_SOSIAL',
        assistance_type: '',
        reason: '',
        family_members_count: 1,
        monthly_income_range: 'KURANG_DARI_1JT'
      });
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">✅ Permohonan Berhasil Diajukan</CardTitle>
          <CardDescription>
            Permohonan bantuan sosial Anda telah berhasil disubmit ke sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Nomor Tracking:</strong> <Badge variant="outline">{trackingNumber}</Badge></p>
                <p className="text-sm">
                  Simpan nomor tracking ini untuk melacak status permohonan Anda. 
                  Anda juga dapat menggunakan NIK untuk tracking.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Langkah Selanjutnya:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Permohonan akan diverifikasi dalam 1-2 hari kerja</li>
              <li>• Tim akan menghubungi untuk konfirmasi data jika diperlukan</li>
              <li>• Pantau status permohonan melalui menu "Lacak Permohonan"</li>
              <li>• Siapkan dokumen pendukung yang mungkin diperlukan</li>
            </ul>
          </div>

          <Button 
            onClick={() => setSubmitted(false)} 
            className="w-full"
            variant="outline"
          >
            Ajukan Permohonan Lain
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            📝 Form Permohonan Bantuan Sosial
          </CardTitle>
          <CardDescription>
            Isi form berikut dengan data yang lengkap dan akurat untuk mengajukan permohonan bantuan sosial
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              👤 Data Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nik">NIK (16 digit) *</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, nik: e.target.value }))
                  }
                  placeholder="1234567890123456"
                  maxLength={16}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place_of_birth">Tempat Lahir *</Label>
                <Input
                  id="place_of_birth"
                  value={formData.place_of_birth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, place_of_birth: e.target.value }))
                  }
                  placeholder="Kota/Kabupaten kelahiran"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Tanggal Lahir *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ 
                      ...prev, 
                      date_of_birth: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'LAKI_LAKI' | 'PEREMPUAN') =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Pernikahan *</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(value: 'BELUM_MENIKAH' | 'MENIKAH' | 'CERAI_HIDUP' | 'CERAI_MATI') =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, marital_status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BELUM_MENIKAH">Belum Menikah</SelectItem>
                    <SelectItem value="MENIKAH">Menikah</SelectItem>
                    <SelectItem value="CERAI_HIDUP">Cerai Hidup</SelectItem>
                    <SelectItem value="CERAI_MATI">Cerai Mati</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="contoh@email.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="h-5 w-5" />
              🏠 Data Alamat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateApplicationInput) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Alamat lengkap tempat tinggal"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="village">Desa/Kelurahan *</Label>
                <Input
                  id="village"
                  value={formData.village}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, village: e.target.value }))
                  }
                  placeholder="Nama desa/kelurahan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">Kecamatan *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, district: e.target.value }))
                  }
                  placeholder="Nama kecamatan"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assistance Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5" />
              💝 Detail Bantuan yang Dimohon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori Bantuan *</Label>
                <Select
                  value={formData.assistance_category}
                  onValueChange={(value: 'BANTUAN_SOSIAL' | 'BANTUAN_PENDIDIKAN' | 'BANTUAN_KESEHATAN' | 'BANTUAN_EKONOMI' | 'BANTUAN_BENCANA') =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, assistance_category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANTUAN_SOSIAL">Bantuan Sosial</SelectItem>
                    <SelectItem value="BANTUAN_PENDIDIKAN">Bantuan Pendidikan</SelectItem>
                    <SelectItem value="BANTUAN_KESEHATAN">Bantuan Kesehatan</SelectItem>
                    <SelectItem value="BANTUAN_EKONOMI">Bantuan Ekonomi</SelectItem>
                    <SelectItem value="BANTUAN_BENCANA">Bantuan Bencana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistance_type">Jenis Bantuan Spesifik *</Label>
                <Input
                  id="assistance_type"
                  value={formData.assistance_type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, assistance_type: e.target.value }))
                  }
                  placeholder="Contoh: PKH, BPNT, dll"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="family_members_count">Jumlah Anggota Keluarga *</Label>
                <Input
                  id="family_members_count"
                  type="number"
                  min="1"
                  value={formData.family_members_count}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicationInput) => ({ 
                      ...prev, 
                      family_members_count: parseInt(e.target.value) || 1 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Rentang Penghasilan Bulanan *</Label>
                <Select
                  value={formData.monthly_income_range}
                  onValueChange={(value: 'KURANG_DARI_1JT' | '1JT_SAMPAI_2JT' | '2JT_SAMPAI_3JT' | '3JT_SAMPAI_5JT' | 'LEBIH_DARI_5JT') =>
                    setFormData((prev: CreateApplicationInput) => ({ ...prev, monthly_income_range: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KURANG_DARI_1JT">Kurang dari Rp 1.000.000</SelectItem>
                    <SelectItem value="1JT_SAMPAI_2JT">Rp 1.000.000 - Rp 2.000.000</SelectItem>
                    <SelectItem value="2JT_SAMPAI_3JT">Rp 2.000.000 - Rp 3.000.000</SelectItem>
                    <SelectItem value="3JT_SAMPAI_5JT">Rp 3.000.000 - Rp 5.000.000</SelectItem>
                    <SelectItem value="LEBIH_DARI_5JT">Lebih dari Rp 5.000.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Permohonan Bantuan *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateApplicationInput) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Jelaskan secara detail mengapa Anda membutuhkan bantuan ini..."
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Alert className="mb-4">
              <AlertDescription>
                📋 <strong>Perhatian:</strong> Pastikan semua data yang diisi sudah benar. 
                Setelah form disubmit, Anda akan mendapat nomor tracking untuk memantau status permohonan.
              </AlertDescription>
            </Alert>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? 'Memproses...' : '📤 Ajukan Permohonan'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}