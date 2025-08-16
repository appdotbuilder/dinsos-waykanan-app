import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Award, Users, DollarSign, Target, Calendar } from 'lucide-react';
import type { FeaturedProgram } from '../../../server/src/schema';

export function FeaturedProgramsList() {
  const [programs, setPrograms] = useState<FeaturedProgram[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getFeaturedPrograms.query();
      setPrograms(result);
    } catch (error) {
      console.error('Failed to load featured programs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Tidak tersedia';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Memuat program unggulan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activePrograms = programs.filter(program => program.is_active);
  const inactivePrograms = programs.filter(program => !program.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            🏆 Program Unggulan
          </CardTitle>
          <CardDescription>
            Program-program bantuan sosial unggulan Dinas Sosial Kabupaten Way Kanan
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Programs */}
      {activePrograms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Alert>
              <AlertDescription>
                📋 Belum ada program unggulan yang tersedia saat ini. Silakan periksa kembali nanti.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activePrograms
            .sort((a, b) => a.order_index - b.order_index)
            .map((program, index) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="md:flex">
                {/* Program Image */}
                {program.image_path && (
                  <div className="md:w-1/3 h-48 md:h-auto bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <div className="text-6xl opacity-20">🏆</div>
                    {/* In a real implementation, this would be an actual image */}
                    {/* <img src={program.image_path} alt={program.title} className="w-full h-full object-cover" /> */}
                  </div>
                )}
                
                {/* Program Content */}
                <div className={`${program.image_path ? 'md:w-2/3' : 'w-full'} p-6`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          Program #{index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Aktif
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl text-blue-900 mb-2">
                        {program.title}
                      </CardTitle>
                    </div>
                  </div>

                  <CardDescription className="text-gray-700 leading-relaxed mb-4 text-base">
                    {program.description}
                  </CardDescription>

                  {/* Program Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {program.target_beneficiaries && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Target Penerima:</span>
                        <span className="text-gray-600">{program.target_beneficiaries}</span>
                      </div>
                    )}
                    
                    {program.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Anggaran:</span>
                        <span className="text-gray-600">{formatCurrency(program.budget)}</span>
                      </div>
                    )}
                  </div>

                  {/* Program Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dibuat: {program.created_at.toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-xs">
                      Update: {program.updated_at.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Inactive Programs */}
      {inactivePrograms.length > 0 && (
        <div className="space-y-4">
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg text-gray-700">
                📝 Program Tidak Aktif
              </CardTitle>
              <CardDescription>
                Program yang sementara tidak berjalan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inactivePrograms
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((program) => (
                  <Card key={program.id} className="bg-white opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                              Nonaktif
                            </Badge>
                          </div>
                          <CardTitle className="text-lg text-gray-600 mb-2">
                            {program.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-500 line-clamp-3">
                            {program.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {programs.length}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Program</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {activePrograms.length}
              </div>
              <div className="text-sm text-green-700 font-medium">Program Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {programs.filter(p => p.budget && p.budget > 0).length}
              </div>
              <div className="text-sm text-purple-700 font-medium">Program Berauaran</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {programs.reduce((total, p) => p.budget ? total + p.budget : total, 0) > 0 
                  ? Math.round(programs.reduce((total, p) => p.budget ? total + p.budget : total, 0) / 1000000000) 
                  : 0}M
              </div>
              <div className="text-sm text-orange-700 font-medium">Total Anggaran (Miliar)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Information */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h4 className="font-semibold text-yellow-800 flex items-center justify-center gap-2">
              <Target className="h-5 w-5" />
              🎯 Program Bantuan Sosial
            </h4>
            <p className="text-sm text-yellow-700 max-w-2xl mx-auto">
              Program unggulan kami dirancang untuk membantu masyarakat Way Kanan yang membutuhkan. 
              Setiap program memiliki sasaran dan kriteria penerima yang spesifik sesuai dengan kebutuhan masyarakat.
            </p>
            <div className="flex justify-center gap-6 text-sm text-yellow-800 pt-2">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Berkualitas</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Tepat Sasaran</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Berkelanjutan</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}