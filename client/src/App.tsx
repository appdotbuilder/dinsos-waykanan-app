import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ApplicationTracker } from '@/components/ApplicationTracker';
import { ApplicationsList } from '@/components/ApplicationsList';
import { ServicesList } from '@/components/ServicesList';
import { FeaturedProgramsList } from '@/components/FeaturedProgramsList';
import { NewsList } from '@/components/NewsList';
import { Building2, FileText, Search, Users, Megaphone, Award, Newspaper } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Building2 className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold">Dinas Sosial Kabupaten Way Kanan</h1>
                <p className="text-blue-200">Sistem Pengelolaan Bantuan Sosial</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-800 text-blue-100 border-blue-600">
              Online System
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto p-1 bg-transparent justify-start overflow-x-auto">
              <TabsTrigger 
                value="home" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Beranda
              </TabsTrigger>
              <TabsTrigger 
                value="apply" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ajukan Bantuan
              </TabsTrigger>
              <TabsTrigger 
                value="track" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <Search className="h-4 w-4 mr-2" />
                Lacak Permohonan
              </TabsTrigger>
              <TabsTrigger 
                value="applications" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <Users className="h-4 w-4 mr-2" />
                Daftar Permohonan
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Layanan Kami
              </TabsTrigger>
              <TabsTrigger 
                value="programs" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <Award className="h-4 w-4 mr-2" />
                Program Unggulan
              </TabsTrigger>
              <TabsTrigger 
                value="news" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 whitespace-nowrap"
              >
                <Newspaper className="h-4 w-4 mr-2" />
                Berita & Pengumuman
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <div className="py-8">
              <TabsContent value="home" className="mt-0">
                <div className="container mx-auto px-4 space-y-8">
                  {/* Hero Section */}
                  <Card className="border-0 bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    <CardHeader className="text-center py-12">
                      <CardTitle className="text-4xl font-bold mb-4">
                        Selamat Datang di Portal Bantuan Sosial
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-lg max-w-2xl mx-auto">
                        Sistem informasi terpadu untuk mengelola dan mengakses berbagai program bantuan sosial 
                        di Kabupaten Way Kanan secara online dan transparan.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                          onClick={() => setActiveTab('apply')}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-blue-900">Ajukan Permohonan Bantuan</CardTitle>
                            <CardDescription>
                              Daftar untuk mendapatkan bantuan sosial sesuai kebutuhan Anda
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                          onClick={() => setActiveTab('track')}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Search className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-green-900">Lacak Status Permohonan</CardTitle>
                            <CardDescription>
                              Pantau perkembangan permohonan bantuan yang telah diajukan
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center">📊 Statistik Bantuan Sosial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">1,247</div>
                          <div className="text-sm text-gray-600">Permohonan Diproses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">892</div>
                          <div className="text-sm text-gray-600">Bantuan Disalurkan</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600">5</div>
                          <div className="text-sm text-gray-600">Program Aktif</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">12</div>
                          <div className="text-sm text-gray-600">Layanan Tersedia</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="apply" className="mt-0">
                <div className="container mx-auto px-4">
                  <ApplicationForm />
                </div>
              </TabsContent>

              <TabsContent value="track" className="mt-0">
                <div className="container mx-auto px-4">
                  <ApplicationTracker />
                </div>
              </TabsContent>

              <TabsContent value="applications" className="mt-0">
                <div className="container mx-auto px-4">
                  <ApplicationsList />
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-0">
                <div className="container mx-auto px-4">
                  <ServicesList />
                </div>
              </TabsContent>

              <TabsContent value="programs" className="mt-0">
                <div className="container mx-auto px-4">
                  <FeaturedProgramsList />
                </div>
              </TabsContent>

              <TabsContent value="news" className="mt-0">
                <div className="container mx-auto px-4">
                  <NewsList />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </nav>

      {/* Footer */}
      <footer className="bg-blue-900 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dinas Sosial Kabupaten Way Kanan
              </h3>
              <p className="text-blue-200 text-sm">
                Melayani masyarakat Way Kanan dengan program bantuan sosial yang tepat sasaran dan berkelanjutan.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-3">📞 Kontak</h3>
              <p className="text-blue-200 text-sm mb-1">Telepon: (0721) 123-456</p>
              <p className="text-blue-200 text-sm mb-1">Email: dinsos@waykanan.go.id</p>
              <p className="text-blue-200 text-sm">Alamat: Jl. Raya Way Kanan No. 1</p>
            </div>
            <div>
              <h3 className="font-bold mb-3">🕒 Jam Layanan</h3>
              <p className="text-blue-200 text-sm mb-1">Senin - Jumat: 08.00 - 16.00</p>
              <p className="text-blue-200 text-sm mb-1">Sabtu: 08.00 - 12.00</p>
              <p className="text-blue-200 text-sm">Minggu: Tutup</p>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-4 text-center">
            <p className="text-blue-200 text-sm">
              © 2024 Dinas Sosial Kabupaten Way Kanan. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;