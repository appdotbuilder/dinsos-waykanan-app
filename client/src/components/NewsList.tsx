import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Newspaper, Megaphone, Calendar, Eye, RefreshCw } from 'lucide-react';
import type { News } from '../../../server/src/schema';

export function NewsList() {
  const [allNews, setAllNews] = useState<News[]>([]);
  const [announcements, setAnnouncements] = useState<News[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const loadNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const result = await trpc.getNews.query();
      setAllNews(result);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    try {
      const result = await trpc.getAnnouncements.query();
      setAnnouncements(result);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    loadAnnouncements();
  }, [loadNews, loadAnnouncements]);

  const NewsCard = ({ news }: { news: News }) => (
    <Card key={news.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={news.is_announcement ? "default" : "secondary"}
                className={news.is_announcement ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}
              >
                {news.is_announcement ? (
                  <>
                    <Megaphone className="h-3 w-3 mr-1" />
                    Pengumuman
                  </>
                ) : (
                  <>
                    <Newspaper className="h-3 w-3 mr-1" />
                    Berita
                  </>
                )}
              </Badge>
              {news.is_published && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <Eye className="h-3 w-3 mr-1" />
                  Dipublikasi
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg text-gray-900 line-clamp-2 mb-2">
              {news.title}
            </CardTitle>
          </div>
          {news.image_path && (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
              <div className="text-2xl opacity-30">
                {news.is_announcement ? '📢' : '📰'}
              </div>
              {/* In a real implementation, this would be an actual image */}
              {/* <img src={news.image_path} alt={news.title} className="w-full h-full object-cover rounded-lg" /> */}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {news.summary && (
          <CardDescription className="text-gray-600 mb-3 line-clamp-2">
            {news.summary}
          </CardDescription>
        )}
        
        <CardDescription className="text-gray-700 leading-relaxed line-clamp-3 mb-4">
          {news.content}
        </CardDescription>

        <Separator className="my-4" />

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {news.published_at ? (
              <span>Dipublikasi: {news.published_at.toLocaleDateString('id-ID')}</span>
            ) : (
              <span>Dibuat: {news.created_at.toLocaleDateString('id-ID')}</span>
            )}
          </div>
          <div className="text-xs">
            Update: {news.updated_at.toLocaleDateString('id-ID')}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const LoadingCard = () => (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Memuat konten...</p>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="text-center py-12">
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const publishedNews = allNews.filter(news => news.is_published);
  const regularNews = publishedNews.filter(news => !news.is_announcement);
  const publishedAnnouncements = publishedNews.filter(news => news.is_announcement);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            📰 Berita & Pengumuman
          </CardTitle>
          <CardDescription>
            Informasi terkini dan pengumuman penting dari Dinas Sosial Kabupaten Way Kanan
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{publishedNews.length}</div>
              <div className="text-sm text-blue-700">Total Dipublikasi</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{regularNews.length}</div>
              <div className="text-sm text-green-700">Berita</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{publishedAnnouncements.length}</div>
              <div className="text-sm text-red-700">Pengumuman</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Date().getFullYear()}
              </div>
              <div className="text-sm text-purple-700">Tahun</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="news">Berita</TabsTrigger>
            <TabsTrigger value="announcements">Pengumuman</TabsTrigger>
          </TabsList>
          
          <Button
            onClick={() => {
              loadNews();
              loadAnnouncements();
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <TabsContent value="all" className="space-y-6 mt-6">
          {isLoadingNews ? (
            <LoadingCard />
          ) : publishedNews.length === 0 ? (
            <EmptyState message="📋 Belum ada berita atau pengumuman yang dipublikasi." />
          ) : (
            <div className="space-y-6">
              {/* Latest Announcements First */}
              {publishedAnnouncements.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    📢 Pengumuman Terbaru
                  </h3>
                  <div className="grid gap-6">
                    {publishedAnnouncements
                      .sort((a, b) => {
                        const aDate = a.published_at || a.created_at;
                        const bDate = b.published_at || b.created_at;
                        return new Date(bDate).getTime() - new Date(aDate).getTime();
                      })
                      .slice(0, 3)
                      .map((news) => (
                        <NewsCard key={news.id} news={news} />
                      ))}
                  </div>
                </div>
              )}

              {/* Latest News */}
              {regularNews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    📰 Berita Terbaru
                  </h3>
                  <div className="grid gap-6">
                    {regularNews
                      .sort((a, b) => {
                        const aDate = a.published_at || a.created_at;
                        const bDate = b.published_at || b.created_at;
                        return new Date(bDate).getTime() - new Date(aDate).getTime();
                      })
                      .slice(0, 5)
                      .map((news) => (
                        <NewsCard key={news.id} news={news} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-6 mt-6">
          {isLoadingNews ? (
            <LoadingCard />
          ) : regularNews.length === 0 ? (
            <EmptyState message="📋 Belum ada berita yang dipublikasi." />
          ) : (
            <div className="grid gap-6">
              {regularNews
                .sort((a, b) => {
                  const aDate = a.published_at || a.created_at;
                  const bDate = b.published_at || b.created_at;
                  return new Date(bDate).getTime() - new Date(aDate).getTime();
                })
                .map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6 mt-6">
          {isLoadingAnnouncements ? (
            <LoadingCard />
          ) : publishedAnnouncements.length === 0 ? (
            <EmptyState message="📋 Belum ada pengumuman yang dipublikasi." />
          ) : (
            <div className="grid gap-6">
              {publishedAnnouncements
                .sort((a, b) => {
                  const aDate = a.published_at || a.created_at;
                  const bDate = b.published_at || b.created_at;
                  return new Date(bDate).getTime() - new Date(aDate).getTime();
                })
                .map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Information Footer */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-green-800 flex items-center justify-center gap-2">
              📬 Dapatkan Update Terbaru
            </h4>
            <p className="text-sm text-green-700">
              Pantau terus halaman ini untuk mendapatkan informasi terbaru tentang 
              program bantuan sosial dan pengumuman penting lainnya.
            </p>
            <div className="flex justify-center gap-4 text-sm text-green-800 pt-2">
              <span>📅 Update Berkala</span>
              <span>🔔 Pengumuman Penting</span>
              <span>📰 Berita Terkini</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}