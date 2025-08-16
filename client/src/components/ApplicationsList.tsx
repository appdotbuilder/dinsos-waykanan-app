import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Users, Search, Filter, Calendar, MapPin, FileText } from 'lucide-react';
import type { SocialAssistanceApplication, ApplicationStatus } from '../../../server/src/schema';

export function ApplicationsList() {
  const [applications, setApplications] = useState<SocialAssistanceApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<SocialAssistanceApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getApplications.query();
      setApplications(result);
      setFilteredApplications(result);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((app) =>
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.nik.includes(searchTerm) ||
        app.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((app) => app.assistance_category === categoryFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, categoryFilter]);

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusConfig = {
      SUBMITTED: { label: 'Diajukan', color: 'bg-blue-100 text-blue-800' },
      UNDER_REVIEW: { label: 'Dalam Tinjauan', color: 'bg-yellow-100 text-yellow-800' },
      VERIFIED: { label: 'Terverifikasi', color: 'bg-purple-100 text-purple-800' },
      APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
      COMPLETED: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'BANTUAN_SOSIAL': 'Bantuan Sosial',
      'BANTUAN_PENDIDIKAN': 'Bantuan Pendidikan',
      'BANTUAN_KESEHATAN': 'Bantuan Kesehatan',
      'BANTUAN_EKONOMI': 'Bantuan Ekonomi',
      'BANTUAN_BENCANA': 'Bantuan Bencana'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getIncomeRangeLabel = (range: string) => {
    const labels = {
      'KURANG_DARI_1JT': '< Rp 1 Juta',
      '1JT_SAMPAI_2JT': 'Rp 1-2 Juta',
      '2JT_SAMPAI_3JT': 'Rp 2-3 Juta',
      '3JT_SAMPAI_5JT': 'Rp 3-5 Juta',
      'LEBIH_DARI_5JT': '> Rp 5 Juta'
    };
    return labels[range as keyof typeof labels] || range;
  };

  const getStatusCounts = () => {
    return {
      total: applications.length,
      submitted: applications.filter(app => app.status === 'SUBMITTED').length,
      under_review: applications.filter(app => app.status === 'UNDER_REVIEW').length,
      verified: applications.filter(app => app.status === 'VERIFIED').length,
      approved: applications.filter(app => app.status === 'APPROVED').length,
      rejected: applications.filter(app => app.status === 'REJECTED').length,
      completed: applications.filter(app => app.status === 'COMPLETED').length
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Memuat daftar permohonan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            📊 Daftar Permohonan Bantuan Sosial
          </CardTitle>
          <CardDescription>
            Kelola dan pantau semua permohonan bantuan sosial yang masuk
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.submitted}</div>
              <div className="text-sm text-blue-600">Diajukan</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.under_review}</div>
              <div className="text-sm text-yellow-600">Tinjauan</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{statusCounts.verified}</div>
              <div className="text-sm text-purple-600">Verifikasi</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
              <div className="text-sm text-green-600">Disetujui</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
              <div className="text-sm text-red-600">Ditolak</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{statusCounts.completed}</div>
              <div className="text-sm text-emerald-600">Selesai</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, NIK, atau tracking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="SUBMITTED">Diajukan</SelectItem>
                <SelectItem value="UNDER_REVIEW">Dalam Tinjauan</SelectItem>
                <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="BANTUAN_SOSIAL">Bantuan Sosial</SelectItem>
                <SelectItem value="BANTUAN_PENDIDIKAN">Bantuan Pendidikan</SelectItem>
                <SelectItem value="BANTUAN_KESEHATAN">Bantuan Kesehatan</SelectItem>
                <SelectItem value="BANTUAN_EKONOMI">Bantuan Ekonomi</SelectItem>
                <SelectItem value="BANTUAN_BENCANA">Bantuan Bencana</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadApplications} variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📋 Daftar Permohonan</CardTitle>
            <Badge variant="outline">
              {filteredApplications.length} dari {applications.length} permohonan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <Alert>
              <AlertDescription>
                {applications.length === 0 
                  ? "📋 Belum ada permohonan bantuan yang diajukan." 
                  : "🔍 Tidak ada permohonan yang sesuai dengan filter pencarian."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking & Pemohon</TableHead>
                    <TableHead>Bantuan</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm font-medium">
                              {application.tracking_number}
                            </span>
                          </div>
                          <div className="font-medium">{application.full_name}</div>
                          <div className="text-sm text-gray-500">
                            NIK: {application.nik}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.gender === 'LAKI_LAKI' ? '👨' : '👩'} 
                            {' '}
                            {application.family_members_count} anggota keluarga
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getCategoryLabel(application.assistance_category)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.assistance_type}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getIncomeRangeLabel(application.monthly_income_range)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div>{application.village}</div>
                            <div className="text-gray-500">{application.district}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(application.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="text-sm">
                            <div>{application.created_at.toLocaleDateString('id-ID')}</div>
                            <div className="text-gray-500">
                              {application.created_at.toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-blue-900">📈 Ringkasan</h4>
            <p className="text-sm text-blue-700">
              Menampilkan {filteredApplications.length} permohonan dari total {applications.length} permohonan 
              bantuan sosial yang terdaftar dalam sistem.
            </p>
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-blue-700 border-blue-300"
                >
                  🔄 Reset Filter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}