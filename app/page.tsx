'use client'
import { useState, ChangeEvent } from 'react';
import Spinner from '../components/Spinner';

interface Item {
  [key: string]: any;
}

interface TranslatedItem extends Item {
  [key: string]: any;
}

interface LanguageOption {
  value: string;
  label: string;
}

interface KeyTranslation {
  key: string;
  newKey: string;
  targetLang: string;
}

export default function Home() {
  const [fileContent, setFileContent] = useState<Item[] | null>(null);
  const [translatedContent, setTranslatedContent] = useState<TranslatedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keysToTranslate, setKeysToTranslate] = useState<KeyTranslation[]>([]);
  const [sourceLang, setSourceLang] = useState<string>('az');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileRead = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        try {
          const json = JSON.parse(e.target.result as string);
          setFileContent(json);
          const keys = Object.keys(json[0] || {});
          setKeysToTranslate(keys.map(key => ({ key, newKey: `${key}_translated`, targetLang: 'en' })));
        } catch (err) {
          if (err instanceof Error) {
            setError('Error reading file');
          } else {
            setError('An unknown error occurred');
          }
        }
      } else {
        setError('No result found in file reader');
      }
    };
    reader.readAsText(file);
  };

  const handleTranslate = async () => {
    if (!fileContent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: fileContent,
          keysToTranslate,
          sourceLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Error translating content');
      }

      const data: TranslatedItem[] = await response.json();
      setTranslatedContent(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!translatedContent) return;

    const blob = new Blob([JSON.stringify(translatedContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_modified.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyChange = (index: number, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setKeysToTranslate((prev) => {
      const newKeys = [...prev];
      newKeys[index] = { ...newKeys[index], [name]: value };
      return newKeys;
    });
  };

  const handleAddKey = () => {
    setKeysToTranslate((prev) => [...prev, { key: '', newKey: '', targetLang: 'en' }]);
  };

  const handleRemoveKey = (index: number) => {
    setKeysToTranslate((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSourceLangChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSourceLang(event.target.value);
  };

  const languageOptions: LanguageOption[] = [
    { value: 'az', label: 'Azerbaijani' },
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Russian' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-black p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Translate JSON Keys</h1>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
      <input
        type="file"
        accept=".json"
        onChange={handleFileRead}
        className="mb-4 border border-gray-300 rounded p-2 w-full max-w-md"
      />
      <div className="mb-4 w-full max-w-md">
        <label className="block text-lg font-medium mb-1">Select source language:</label>
        <select
          value={sourceLang}
          onChange={handleSourceLangChange}
          className="border border-gray-300 rounded p-2 w-full"
        >
          {languageOptions.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 w-full max-w-md">
        <label className="block text-lg font-medium mb-1">Keys to translate:</label>
        {keysToTranslate.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-4 mb-2 items-center">
            <input
              type="text"
              name="key"
              placeholder="Key to translate"
              value={item.key}
              onChange={(e) => handleKeyChange(index, e)}
              className="border border-gray-300 rounded p-2 flex-1"
            />
            <input
              type="text"
              name="newKey"
              placeholder="New key name"
              value={item.newKey}
              onChange={(e) => handleKeyChange(index, e)}
              className="border border-gray-300 rounded p-2 flex-1"
            />
            <select
              name="targetLang"
              value={item.targetLang}
              onChange={(e) => handleKeyChange(index, e)}
              className="border border-gray-300 rounded p-2 flex-shrink-0"
            >
              {languageOptions.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleRemoveKey(index)}
              className="bg-red-500 text-white rounded p-2 flex-shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddKey}
          className="bg-blue-500 text-white rounded p-2 w-full max-w-md"
        >
          Add Key
        </button>
      </div>
      <button
        onClick={handleTranslate}
        disabled={loading}
        className={`bg-green-500 text-white rounded p-2 mb-4 w-full max-w-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? <Spinner /> : 'Translate'}
      </button>
      <button
        onClick={handleDownload}
        disabled={!translatedContent || loading}
        className={`bg-yellow-500 text-white rounded p-2 w-full max-w-md ${!translatedContent || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Download Translated File
      </button>
    </div>
  );
}
