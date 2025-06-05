import React, { useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface TemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
  isReadOnly?: boolean;
  className?: string;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  isReadOnly = false,
  className = '',
}) => {
  // Fonction pour raccourcir les données base64 dans le contenu
  const processContent = useMemo(() => {
    // Raccourcir les images base64 dans le contenu
    const processedContent = content.replace(
      /(<img[\s\S]*?src=["'])(data:image\/[^;]+;base64,)([^"']+)(["'][\s\S]*?>)/gi,
      (match, prefix, dataPrefix, base64Data, suffix) => {
        // Raccourcir le contenu de l'image
        const shortBase64 = base64Data.length > 50 
          ? `${base64Data.substring(0, 20)}... [base64 image, ${(base64Data.length / 1024).toFixed(1)} KB]` 
          : base64Data;
        // Retourner la balise img avec le contenu raccourci
        return `${prefix}${dataPrefix}${shortBase64}${suffix}`;
      }
    );
    return processedContent;
  }, [content]);

  // Fonction pour restaurer le contenu complet lors de l'édition
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Si on modifie le contenu, on utilise la valeur directement
    // (cela évitera de traiter à nouveau le contenu modifié)
    onChange(e.target.value);
  };

  // Fonction pour afficher le contenu avec les images raccourcies
  const displayValue = useMemo(() => {
    if (isReadOnly) {
      return processContent;
    }
    return content;
  }, [content, isReadOnly, processContent]);

  return (
    <div className={`h-full ${className}`}>
      <Textarea
        className="w-full h-full p-4 rounded-lg bg-muted font-mono text-sm resize-none whitespace-pre"
        value={displayValue}
        onChange={handleChange}
        readOnly={isReadOnly}
        spellCheck={false}
        placeholder="Éditez le contenu du template ici..."
        wrap="off"
      />
    </div>
  );
};

export default TemplateEditor;
