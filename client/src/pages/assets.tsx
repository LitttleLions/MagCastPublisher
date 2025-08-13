import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Asset } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Trash2, Download, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Assets() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const uploadAssetMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Success",
        description: "Asset uploaded successfully",
      });
      setUploadDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload asset",
        variant: "destructive",
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/assets/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    uploadAssetMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ready</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-slate-200 rounded mb-4" />
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Asset Management</h1>
          <p className="text-slate-600">
            Upload, organize, and manage image assets for your magazine publications
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-brand-600 hover:bg-brand-700 text-white"
              data-testid="button-upload-asset"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Asset</DialogTitle>
              <DialogDescription>
                Upload images that can be used in your magazine articles.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Choose File</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  data-testid="input-file"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadAssetMutation.isPending}
                  data-testid="button-upload"
                >
                  {uploadAssetMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asset Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Assets</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-total-assets">
                  {assets.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ready</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-ready-assets">
                  {assets.filter(a => a.status === "ready").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Processing</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-processing-assets">
                  {assets.filter(a => a.status === "processing").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Size</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-total-size">
                  {formatFileSize(assets.reduce((sum, asset) => sum + asset.size, 0))}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Assets Found</h3>
            <p className="text-slate-600 mb-4">
              Upload your first image asset to get started with magazine publishing.
            </p>
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="border border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square bg-slate-100 rounded-lg mb-4 overflow-hidden">
                  {asset.status === "ready" && asset.processedUrl ? (
                    <img
                      src={asset.processedUrl}
                      alt={asset.filename}
                      className="w-full h-full object-cover"
                      data-testid={`asset-image-${asset.id}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getStatusIcon(asset.status || "processing")}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 truncate" data-testid={`asset-name-${asset.id}`}>
                      {asset.filename}
                    </h3>
                    {getStatusBadge(asset.status || "processing")}
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(asset.size)}</span>
                    </div>
                    {asset.width && asset.height && (
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span>{asset.width} × {asset.height}</span>
                      </div>
                    )}
                    {asset.dpi && (
                      <div className="flex justify-between">
                        <span>DPI:</span>
                        <span className={asset.dpi < 220 ? "text-amber-600" : "text-green-600"}>
                          {asset.dpi}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Uploaded:</span>
                      <span>{formatDate(asset.createdAt!)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1 pt-2">
                    {asset.status === "ready" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPreviewAsset(asset)}
                          data-testid={`preview-${asset.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`download-${asset.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteAssetMutation.mutate(asset.id)}
                      disabled={deleteAssetMutation.isPending}
                      data-testid={`delete-${asset.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.filename}</DialogTitle>
            <DialogDescription>
              Asset preview and details
            </DialogDescription>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img
                  src={previewAsset.processedUrl || previewAsset.originalUrl}
                  alt={previewAsset.filename}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">File Size:</span>
                  <span className="ml-2 text-slate-600">{formatFileSize(previewAsset.size)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">MIME Type:</span>
                  <span className="ml-2 text-slate-600">{previewAsset.mimeType}</span>
                </div>
                {previewAsset.width && previewAsset.height && (
                  <>
                    <div>
                      <span className="font-medium text-slate-700">Width:</span>
                      <span className="ml-2 text-slate-600">{previewAsset.width}px</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Height:</span>
                      <span className="ml-2 text-slate-600">{previewAsset.height}px</span>
                    </div>
                  </>
                )}
                {previewAsset.dpi && (
                  <div>
                    <span className="font-medium text-slate-700">DPI:</span>
                    <span className={`ml-2 ${previewAsset.dpi < 220 ? "text-amber-600" : "text-green-600"}`}>
                      {previewAsset.dpi}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-slate-700">Status:</span>
                  <span className="ml-2">{getStatusBadge(previewAsset.status || "processing")}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
