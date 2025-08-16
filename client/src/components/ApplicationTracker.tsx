import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Search, CheckCircle, Clock, XCircle, FileText, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import type { ApplicationTrackingResponse, ApplicationStatus } from '../../../server/src/schema';

export function ApplicationTracker() {
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<{
    tracking_number: string;
    nik: string;
  }>({
    tracking_number: '',
    nik: ''
  });
  const [applicationData, setApplicationData] = useState<ApplicationTrackingResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setApplicationData(null);

    try {
      const response = await trpc.trackApplication.query(trackingData);
      setApplicationData(response);
    } catch (error) {
      console.error('Failed to track application:', error);
      setError('Permohonan tidak ditemukan. Periksa kembali nomor tracking dan NIK Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusConfig = {
      SUBMITTED: { label: 'Diajukan', color: 'bg-blue-100 text-blue-800', icon: FileText },
      UNDER_REVIEW: { label: 'Dalam Tinjauan', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      VERIFIED: { label: 'Terverifikasi', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
      COMPLETED: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusProgress = (status: ApplicationStatus) => {
    const statusOrder = {
      SUBMITTED: 20,
      UNDER_REVIEW: 40,
      VERIFIED: 60,
      APPROVED: 80,
      COMPLETED: 100,
      REJECTED: 0
    };
    return statusOrder[status] || 0;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Tidak tersedia';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getIncomeRangeLabel = (range: string) => {
    const labels = {
      'KURANG_DARI_1JT': 'Kurang dari Rp 1.000.000',
      '1JT_SAMPAI_2JT': 'Rp 1.000.000 - Rp 2.000.000',
      '2JT_SAMPAI_3JT': 'Rp 2.000.000 - Rp 3.000.000',
      '3JT_SAMPAI_5JT': 'Rp 3.000.000 - Rp 5.000.000',
      'LEBIH_DARI_5JT': 'Lebih dari Rp 5.000.000'
    };
    return labels[range as keyof typeof labels] || range;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            🔍 Lacak Status Permohonan
          </CardTitle>
          <CardDescription>
            Masukkan nomor tracking dan NIK untuk melacak status permohonan bantuan sosial Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tracking_number">Nomor Tracking *</Label>
                <Input
                  id="tracking_number"
                  value={trackingData.tracking_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrackingData((prev) => ({ ...prev, tracking_number: e.target.value }))
                  }
                  placeholder="Masukkan nomor tracking"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nik">NIK (16 digit) *</Label>
                <Input
                  id="nik"
                  value={trackingData.nik}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrackingData((prev) => ({ ...prev, nik: e.target.value }))
                  }
                  placeholder="1234567890123456"
                  maxLength={16}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? 'Mencari...' : 'Lacak Permohonan'}
            </Button>
          </form>

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {applicationData && (
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📋 Status Permohonan</CardTitle>
                {getStatusBadge(applicationData.application.status)}
              </div>
              <CardDescription>
                Tracking: {applicationData.application.tracking_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getStatusProgress(applicationData.application.status)}%</span>
                </div>
                <Progress 
                  value={getStatusProgress(applicationData.application.status)} 
                  className="h-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Diajukan: {applicationData.application.created_at.toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Update terakhir: {applicationData.application.updated_at.toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>👤 Detail Permohonan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Data Pemohon</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nama:</strong> {applicationData.application.full_name}</p>
                    <p><strong>NIK:</strong> {applicationData.application.nik}</p>
                    <p><strong>Tempat/Tanggal Lahir:</strong> {applicationData.application.place_of_birth}, {applicationData.application.date_of_birth.toLocaleDateString('id-ID')}</p>
                    <p><strong>Jenis Kelamin:</strong> {applicationData.application.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</p>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{applicationData.application.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{applicationData.application.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Data Bantuan</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Kategori:</strong> {applicationData.application.assistance_category.replace(/_/g, ' ')}</p>
                    <p><strong>Jenis:</strong> {applicationData.application.assistance_type}</p>
                    <p><strong>Anggota Keluarga:</strong> {applicationData.application.family_members_count} orang</p>
                    <p><strong>Penghasilan:</strong> {getIncomeRangeLabel(applicationData.application.monthly_income_range)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Alamat
                </h4>
                <p className="text-sm text-gray-600">
                  {applicationData.application.address}<br />
                  Desa {applicationData.application.village}, Kecamatan {applicationData.application.district}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Alasan Permohonan</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {applicationData.application.reason}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {applicationData.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📈 Timeline Permohonan</CardTitle>
                <CardDescription>
                  Riwayat perubahan status permohonan Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applicationData.timeline
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((timeline, index) => (
                    <div key={timeline.id} className="flex items-start gap-3 pb-4">
                      <div className={`p-2 rounded-full ${index === 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        {getStatusBadge(timeline.status)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">
                            Status: {getStatusBadge(timeline.status)}
                          </h5>
                          <span className="text-sm text-gray-500">
                            {timeline.created_at.toLocaleDateString('id-ID')} {timeline.created_at.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {timeline.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {timeline.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {applicationData.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📄 Dokumen Terlampir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {applicationData.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-md">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.document_type.replace(/_/g, ' ')} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-400">
                          Diunggah: {doc.uploaded_at.toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-blue-900">📞 Butuh Bantuan?</h4>
                <p className="text-sm text-blue-700">
                  Jika ada pertanyaan tentang status permohonan Anda, hubungi:
                </p>
                <div className="flex justify-center gap-4 text-sm text-blue-800">
                  <span>📱 (0721) 123-456</span>
                  <span>📧 dinsos@waykanan.go.id</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}