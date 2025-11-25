'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterBikePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [documentation, setDocumentation] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      // Limit to 5 photos
      if (fileArray.length > 5) {
        setError('Maximum 5 photos allowed');
        return;
      }
      setPhotos(fileArray);
    }
  };

  const handleDocumentationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      // Limit to 10 documents
      if (fileArray.length > 10) {
        setError('Maximum 10 documents allowed');
        return;
      }
      setDocumentation(fileArray);
    }
  };

  const uploadFiles = async (files: File[], bucketName: string, folder: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setUploadProgress(`Uploading ${file.name}...`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Get public URL for photos, signed URL for documents
      if (bucketName === 'bike-photos') {
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);
        uploadedUrls.push(publicUrl);
      } else {
        uploadedUrls.push(data.path);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    setUploadProgress('');

    try {
      if (!user) {
        throw new Error('You must be logged in to register a bike');
      }

      // Validate inputs
      const yearNum = parseInt(year);
      const mileageNum = parseInt(mileage);

      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        throw new Error('Please enter a valid year');
      }

      if (isNaN(mileageNum) || mileageNum < 0) {
        throw new Error('Please enter a valid mileage');
      }

      let photoUrls: string[] = [];
      let docUrls: string[] = [];

      // Upload photos if any
      if (photos.length > 0) {
        photoUrls = await uploadFiles(photos, 'bike-photos', user.id);
      }

      // Upload documentation if any
      if (documentation.length > 0) {
        docUrls = await uploadFiles(documentation, 'bike-docs', user.id);
      }

      setUploadProgress('Saving bike information...');

      // Insert bike data into database
      const { error: dbError } = await supabase
        .from('bikes')
        .insert([
          {
            user_id: user.id,
            brand,
            year: yearNum,
            mileage: mileageNum,
            photos: photoUrls,
            documentation: docUrls,
          },
        ]);

      if (dbError) {
        throw dbError;
      }

      setSuccess(true);
      setUploadProgress('');

      // Reset form
      setBrand('');
      setYear('');
      setMileage('');
      setPhotos([]);
      setDocumentation([]);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register bike');
      setUploadProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register Your Bike</h1>
          <p className="mt-2 text-gray-600">Add your motorcycle information to your profile</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-700">
                Bike registered successfully! Redirecting to home...
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">{uploadProgress}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Brand Field */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                What brand? *
              </label>
              <select
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select a brand</option>
                <option value="BMW">BMW</option>
                <option value="Ducati">Ducati</option>
                <option value="Harley-Davidson">Harley-Davidson</option>
                <option value="Honda">Honda</option>
                <option value="Kawasaki">Kawasaki</option>
                <option value="KTM">KTM</option>
                <option value="Suzuki">Suzuki</option>
                <option value="Triumph">Triumph</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Aprilia">Aprilia</option>
                <option value="MV Agusta">MV Agusta</option>
                <option value="Royal Enfield">Royal Enfield</option>
                <option value="Husqvarna">Husqvarna</option>
                <option value="Benelli">Benelli</option>
                <option value="Moto Guzzi">Moto Guzzi</option>
                <option value="Indian">Indian</option>
                <option value="Vespa">Vespa</option>
                <option value="Piaggio">Piaggio</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Year Field */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="2020"
              />
            </div>

            {/* Mileage Field */}
            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-2">
                Mileage (km) *
              </label>
              <input
                id="mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="15000"
              />
            </div>

            {/* Photos Upload */}
            <div>
              <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-2">
                Photos (optional, max 5)
              </label>
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photos.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {photos.length} photo(s) selected
                </p>
              )}
            </div>

            {/* Documentation Upload */}
            <div>
              <label htmlFor="documentation" className="block text-sm font-medium text-gray-700 mb-2">
                Documentation from services/repairs (optional, max 10)
              </label>
              <input
                id="documentation"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={handleDocumentationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {documentation.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {documentation.length} document(s) selected
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Bike'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
