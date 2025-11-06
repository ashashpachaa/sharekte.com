import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SocialMediaLink,
  fetchSocialMediaLinks,
  createSocialMediaLink,
  updateSocialMediaLink,
  deleteSocialMediaLink,
  SOCIAL_MEDIA_ICONS,
} from "@/lib/social-media";
import {
  Trash2,
  Plus,
  Edit2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

// Get all available platforms from icons
const AVAILABLE_PLATFORMS = Object.keys(SOCIAL_MEDIA_ICONS).sort();

export function AdminSocialLinks() {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    icon: "",
    url: "",
    displayText: "",
    isActive: true,
  });

  // Load social media links
  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    try {
      setLoading(true);
      const data = await fetchSocialMediaLinks();
      setLinks(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error loading social media links:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingLink(null);
    setFormData({
      platform: "",
      icon: "",
      url: "",
      displayText: "",
      isActive: true,
    });
    setShowDialog(true);
  }

  function openEditDialog(link: SocialMediaLink) {
    setEditingLink(link);
    setFormData({
      platform: link.platform,
      icon: link.icon || "",
      url: link.url,
      displayText: link.displayText || "",
      isActive: link.isActive,
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!formData.platform || !formData.url) {
      alert("Platform and URL are required");
      return;
    }

    try {
      if (editingLink) {
        await updateSocialMediaLink(editingLink.id, formData);
        alert("Link updated successfully");
      } else {
        await createSocialMediaLink({
          ...formData,
          isActive: formData.isActive,
          order: links.length + 1,
        });
        alert("Link created successfully");
      }

      setShowDialog(false);
      loadLinks();
    } catch (error) {
      console.error("Error saving link:", error);
      alert("Failed to save link");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this social media link?")) {
      return;
    }

    try {
      await deleteSocialMediaLink(id);
      alert("Link deleted successfully");
      loadLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      alert("Failed to delete link");
    }
  }

  function toggleActive(link: SocialMediaLink) {
    updateSocialMediaLink(link.id, { isActive: !link.isActive });
    setLinks(
      links.map((l) =>
        l.id === link.id ? { ...l, isActive: !l.isActive } : l,
      ),
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading social media links...</div>;
  }

  // Show all available platforms grouped by category
  const platformCategories: Record<string, string[]> = {
    "Social Networks": [
      "Twitter (X)",
      "Facebook",
      "Instagram",
      "LinkedIn",
      "Reddit",
      "Snapchat",
      "Pinterest",
      "Threads",
      "Bluesky",
      "Mastodon",
    ],
    "Video Platforms": [
      "YouTube",
      "TikTok",
      "Twitch",
      "Vimeo",
    ],
    "Developer & Tech": [
      "GitHub",
      "GitLab",
      "Dev.to",
      "Medium",
      "Hashnode",
      "Stack Overflow",
    ],
    "Messaging": [
      "Discord",
      "Telegram",
      "WhatsApp",
      "Signal",
      "WeChat",
      "Viber",
    ],
    "Contact": [
      "Email",
      "Phone",
      "Website",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Social Media Links</h2>
          <p className="text-muted-foreground mt-1">
            Manage social media links that appear in the website footer
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Link
        </Button>
      </div>

      {/* Links List */}
      {links.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No social media links configured yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <Card key={link.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Drag Handle */}
                  <div className="cursor-move text-muted-foreground">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Link Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                        <span className="text-4xl">
                          {link.icon || SOCIAL_MEDIA_ICONS[link.platform] || "🔗"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{link.platform}</p>
                        {link.displayText && (
                          <p className="text-sm text-muted-foreground">
                            {link.displayText}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-primary break-all hover:underline">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.url}
                      </a>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Active Status */}
                    <button
                      onClick={() => toggleActive(link)}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                      title={link.isActive ? "Active" : "Inactive"}
                    >
                      {link.isActive ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditDialog(link)}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-950 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Platforms Reference */}
      <div className="pt-8 border-t">
        <h3 className="text-lg font-semibold mb-4">Available Platforms</h3>
        <div className="space-y-4">
          {Object.entries(platformCategories).map(([category, platforms]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {platforms
                  .filter((p) => AVAILABLE_PLATFORMS.includes(p))
                  .map((platform) => (
                    <button
                      key={platform}
                      onClick={() => {
                        const defaultIcon = SOCIAL_MEDIA_ICONS[platform] || "";
                        setFormData({
                          ...formData,
                          platform,
                          icon: defaultIcon,
                        });
                        setEditingLink(null);
                        setShowDialog(true);
                      }}
                      className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm"
                      title={`Add ${platform}`}
                    >
                      <span className="text-lg">
                        {SOCIAL_MEDIA_ICONS[platform] || "🔗"}
                      </span>
                      <span className="hidden sm:inline text-xs">
                        {platform.length > 12
                          ? platform.substring(0, 12) + "..."
                          : platform}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit Social Media Link" : "Add Social Media Link"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Platform Selector */}
            <div>
              <Label htmlFor="platform">Platform Name</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => {
                  const defaultIcon = SOCIAL_MEDIA_ICONS[value] || "";
                  setFormData({
                    ...formData,
                    platform: value,
                    icon: defaultIcon,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a platform..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {SOCIAL_MEDIA_ICONS[platform] || "🔗"}
                        </span>
                        <span>{platform}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Or type a custom platform name below
              </p>
            </div>

            {/* Custom Platform (if needed) */}
            {!AVAILABLE_PLATFORMS.includes(formData.platform) && formData.platform && (
              <div>
                <Label htmlFor="customPlatform">Custom Platform Name</Label>
                <Input
                  id="customPlatform"
                  placeholder="Enter custom platform name"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                />
              </div>
            )}

            {/* Icon */}
            <div>
              <Label htmlFor="icon">Icon (emoji or text)</Label>
              <div className="flex gap-2">
                <Input
                  id="icon"
                  placeholder="e.g., 𝕏, f, 📷"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="flex-1"
                />
                {formData.icon && (
                  <div className="flex items-center justify-center px-3 bg-muted rounded-md text-2xl">
                    {formData.icon}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.platform &&
                SOCIAL_MEDIA_ICONS[formData.platform]
                  ? "Using default icon for this platform. Leave empty or customize."
                  : "Enter custom emoji or text icon"}
              </p>
            </div>

            {/* URL */}
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            {/* Display Text */}
            <div>
              <Label htmlFor="displayText">Display Text (optional)</Label>
              <Input
                id="displayText"
                placeholder="e.g., Follow us on Twitter"
                value={formData.displayText}
                onChange={(e) =>
                  setFormData({ ...formData, displayText: e.target.value })
                }
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="isActive">Show on footer</Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {editingLink ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
