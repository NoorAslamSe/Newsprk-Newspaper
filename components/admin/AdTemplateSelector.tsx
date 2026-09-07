'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Code, Eye, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MediaSelectionModal, MediaItem } from './MediaSelectionModal';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'url' | 'media' | 'color';
  required: boolean;
  defaultValue?: string;
}

export interface AdTemplate {
  id: string;
  name: string;
  description: string;
  category: 'banner' | 'native' | 'video' | 'interactive';
  code: string;
  variables: TemplateVariable[];
  preview: string;
}

interface AdTemplateSelectorProps {
  templates: AdTemplate[];
  selectedTemplate: string | null;
  onTemplateSelect: (templateId: string) => void;
  onCustomCodeToggle: () => void;
  customCodeEnabled: boolean;
  customCode?: string;
  onCustomCodeChange?: (code: string) => void;
  templateVariables?: Record<string, any>;
  onVariableChange?: (variables: Record<string, any>) => void;
}

export function AdTemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onCustomCodeToggle,
  customCodeEnabled,
  customCode = '',
  onCustomCodeChange,
  templateVariables = {},
  onVariableChange,
}: AdTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [mediaSelectionOpen, setMediaSelectionOpen] = useState(false);
  const [mediaSelectionVariable, setMediaSelectionVariable] = useState<string | null>(null);

  const categories = ['all', 'banner', 'native', 'video', 'interactive'];
  
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  // Generate preview code when template or variables change
  useEffect(() => {
    if (selectedTemplateData && !customCodeEnabled) {
      let code = selectedTemplateData.code;
      
      // Replace template variables with actual values
      selectedTemplateData.variables.forEach(variable => {
        const value = templateVariables[variable.name] || variable.defaultValue || '';
        const placeholder = `{{${variable.name}}}`;
        code = code.replace(new RegExp(placeholder, 'g'), value);
      });
      
      setPreviewCode(code);
    } else if (customCodeEnabled) {
      setPreviewCode(customCode);
    }
  }, [selectedTemplateData, templateVariables, customCodeEnabled, customCode]);

  const handleVariableChange = (variableName: string, value: string) => {
    const newVariables = { ...templateVariables, [variableName]: value };
    onVariableChange?.(newVariables);
  };

  const handleMediaSelection = (media: MediaItem | MediaItem[]) => {
    if (mediaSelectionVariable && !Array.isArray(media)) {
      handleVariableChange(mediaSelectionVariable, media.url);
      setMediaSelectionOpen(false);
      setMediaSelectionVariable(null);
    }
  };

  const openMediaSelection = (variableName: string) => {
    setMediaSelectionVariable(variableName);
    setMediaSelectionOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      banner: 'bg-blue-100 text-blue-800',
      native: 'bg-green-100 text-green-800',
      video: 'bg-purple-100 text-purple-800',
      interactive: 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with Custom Code Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ad Template</h3>
          <p className="text-sm text-muted-foreground">
            Choose a template or write custom code
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="custom-code-toggle">Custom Code</Label>
          <Switch
            id="custom-code-toggle"
            checked={customCodeEnabled}
            onCheckedChange={onCustomCodeToggle}
          />
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" disabled={customCodeEnabled}>
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="variables" disabled={customCodeEnabled || !selectedTemplateData}>
            <Code className="w-4 h-4 mr-2" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {!customCodeEnabled && (
            <>
              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template Grid */}
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => onTemplateSelect(template.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {template.preview && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <img
                              src={template.preview}
                              alt={`${template.name} preview`}
                              className="w-full h-20 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          {template.variables.length} variables
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No templates found matching your criteria.
                </div>
              )}
            </>
          )}

          {customCodeEnabled && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are in custom code mode. Write your ad code directly below.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="custom-code">Custom Ad Code</Label>
                <Textarea
                  id="custom-code"
                  placeholder="Enter your custom ad code here..."
                  value={customCode}
                  onChange={(e) => onCustomCodeChange?.(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-4">
          {selectedTemplateData && selectedTemplateData.variables.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure the variables for the selected template:
              </div>
              {selectedTemplateData.variables.map(variable => (
                <div key={variable.name} className="space-y-2">
                  <Label htmlFor={variable.name}>
                    {variable.name}
                    {variable.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {variable.type === 'text' || variable.type === 'url' ? (
                    <Input
                      id={variable.name}
                      type={variable.type === 'url' ? 'url' : 'text'}
                      placeholder={variable.defaultValue || `Enter ${variable.name}...`}
                      value={templateVariables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    />
                  ) : variable.type === 'color' ? (
                    <Input
                      id={variable.name}
                      type="color"
                      value={templateVariables[variable.name] || variable.defaultValue || '#000000'}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    />
                  ) : variable.type === 'media' ? (
                    <div className="flex space-x-2">
                      <Input
                        id={variable.name}
                        placeholder="Media URL or select from library..."
                        value={templateVariables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openMediaSelection(variable.name)}
                      >
                        Browse
                      </Button>
                    </div>
                  ) : null}
                  {variable.defaultValue && (
                    <div className="text-xs text-muted-foreground">
                      Default: {variable.defaultValue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {selectedTemplateData ? 'This template has no configurable variables.' : 'Select a template to configure variables.'}
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Preview of your ad code:
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-xs text-muted-foreground mb-2">Generated Code:</div>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                {previewCode || 'No code to preview'}
              </pre>
            </div>
            {previewCode && (
              <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-2">Live Preview:</div>
                <div 
                  className="border rounded bg-white p-2 min-h-[100px]"
                  dangerouslySetInnerHTML={{ __html: previewCode }}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Media Selection Modal */}
      <MediaSelectionModal
        isOpen={mediaSelectionOpen}
        onClose={() => {
          setMediaSelectionOpen(false);
          setMediaSelectionVariable(null);
        }}
        onMediaSelect={handleMediaSelection}
        filterType="image" // Default to images for ad templates
        title="Select Media for Template"
        description="Choose an image or media file to use in your ad template"
      />
    </div>
  );
}