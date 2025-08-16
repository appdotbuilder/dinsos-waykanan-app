import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Service } from '../../../server/src/schema';

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getServices.query();
      setServices(result);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Memuat layanan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            🏢 Layanan Kami
          </CardTitle>
          <CardDescription>
            Daftar layanan yang tersedia di Dinas Sosial Kabupaten Way Kanan
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Alert>
              <AlertDescription>
                📋 Belum ada layanan yang tersedia saat ini. Silakan periksa kembali nanti.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services
            .filter(service => service.is_active)
            .sort((a, b) => a.order_index - b.order_index)
            .map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {service.icon && (
                      <div className="text-2xl" dangerouslySetInnerHTML={{ __html: service.icon }} />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg text-blue-900 line-clamp-2">
                        {service.title}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge 
                      variant={service.is_active ? "default" : "secondary"}
                      className={service.is_active ? "bg-green-100 text-green-800" : ""}
                    >
                      {service.is_active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Nonaktif
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-gray-600 leading-relaxed">
                  {service.description}
                </CardDescription>
                
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    📅 Dibuat: {service.created_at.toLocaleDateString('id-ID')}
                  </div>
                  <div className="text-xs">
                    #Urutan: {service.order_index}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Show inactive services separately */}
      {services.some(service => !service.is_active) && (
        <div className="space-y-4">
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg text-gray-700">
                📝 Layanan Nonaktif
              </CardTitle>
              <CardDescription>
                Layanan yang sementara tidak tersedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services
                  .filter(service => !service.is_active)
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((service) => (
                  <Card key={service.id} className="bg-white opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {service.icon && (
                          <div className="text-xl opacity-50" dangerouslySetInnerHTML={{ __html: service.icon }} />
                        )}
                        <CardTitle className="text-base text-gray-600">
                          {service.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-gray-500 line-clamp-3">
                        {service.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {services.length}
              </div>
              <div className="text-sm text-blue-700">Total Layanan</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.is_active).length}
              </div>
              <div className="text-sm text-green-700">Layanan Aktif</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {services.filter(s => !s.is_active).length}
              </div>
              <div className="text-sm text-gray-700">Layanan Nonaktif</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Date().getFullYear()}
              </div>
              <div className="text-sm text-purple-700">Tahun Layanan</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-yellow-800">📞 Informasi Layanan</h4>
            <p className="text-sm text-yellow-700">
              Untuk informasi lebih lanjut tentang layanan kami, silakan hubungi:
            </p>
            <div className="flex justify-center gap-4 text-sm text-yellow-800">
              <span>📱 (0721) 123-456</span>
              <span>📧 dinsos@waykanan.go.id</span>
            </div>
            <p className="text-xs text-yellow-600">
              Jam layanan: Senin-Jumat 08:00-16:00, Sabtu 08:00-12:00
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}