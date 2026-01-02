import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { trpc } from '../utils/trpc';

interface FormData {
  // Step 1: Contacts
  name: string;
  email: string;
  phone: string;
  preferredContact: 'phone' | 'messenger' | 'email';
  socialLink: string;
  
  // Step 2: Measurements
  bust: string;
  waist: string;
  hips: string;
  sendMeasurementsLater: boolean;
  photos: File[];
  figureComments: string;
  
  // Step 3: Initials
  metalType: 'gold' | 'silver';
  initials: string;
  
  // Step 4: Delivery
  country: string;
  city: string;
  postalCode: string;
  address: string;
  deliveryMethod: 'courier' | 'europost' | 'cdek';
  desiredDate: string;
  needOnlineMeasurements: boolean;
  
  // Step 5: Confirmation
  dataProcessingConsent: boolean;
  customOrderConsent: boolean;
}

const STEPS = [
  { id: 1, title: 'Контакты', description: 'Ваши данные для связи' },
  { id: 2, title: 'Мерки и рост', description: 'Параметры для пошива' },
  { id: 3, title: 'Инициалы', description: 'Персонализация изделия' },
  { id: 4, title: 'Доставка/сроки', description: 'Условия получения заказа' },
  { id: 5, title: 'Подтверждение', description: 'Финальная проверка данных' }
];

export const CustomOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'phone',
    socialLink: '',
    bust: '',
    waist: '',
    hips: '',
    sendMeasurementsLater: false,
    photos: [],
    figureComments: '',
    metalType: 'gold',
    initials: '',
    country: '',
    city: '',
    postalCode: '',
    address: '',
    deliveryMethod: 'courier',
    desiredDate: '',
    needOnlineMeasurements: false,
    dataProcessingConsent: false,
    customOrderConsent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Автоматический скролл вверх при смене шага
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim() || formData.name.length < 2 || formData.name.length > 50) {
          newErrors.name = 'Имя должно содержать от 2 до 50 символов';
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Введите корректный email адрес';
        }
        if (!formData.phone.trim() || !/^\+?[1-9]\d{6,14}$/.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Введите корректный номер телефона';
        }
        break;
      
      case 2:
        if (!formData.sendMeasurementsLater) {
          if (!formData.bust.trim() || isNaN(Number(formData.bust)) || Number(formData.bust) <= 0) {
            newErrors.bust = 'Введите корректный обхват груди в см';
          }
          if (!formData.waist.trim() || isNaN(Number(formData.waist)) || Number(formData.waist) <= 0) {
            newErrors.waist = 'Введите корректную талию в см';
          }
          if (!formData.hips.trim() || isNaN(Number(formData.hips)) || Number(formData.hips) <= 0) {
            newErrors.hips = 'Введите корректный обхват бёдер в см';
          }
        }
        break;
      
      case 3:
        if (!formData.initials.trim() || formData.initials.length > 20) {
          newErrors.initials = 'Введите инициалы или слово (до 20 символов)';
        }
        break;
      
      case 4:
        if (!formData.country.trim()) newErrors.country = 'Укажите страну';
        if (!formData.city.trim()) newErrors.city = 'Укажите город';
        if (!formData.address.trim()) newErrors.address = 'Укажите адрес';
        break;
      
      case 5:
        if (!formData.dataProcessingConsent) {
          newErrors.dataProcessingConsent = 'Необходимо согласие на обработку данных';
        }
        if (!formData.customOrderConsent) {
          newErrors.customOrderConsent = 'Необходимо согласие с условиями индивидуального пошива';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 15 * 1024 * 1024; // 15MB
      return isValidType && isValidSize;
    });

    if (validFiles.length + formData.photos.length <= 5) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...validFiles]
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const createCustomOrderMutation = trpc.customOrders.create.useMutation();

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    try {
      // Отправка данных на сервер
      await createCustomOrderMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preferredContact: formData.preferredContact,
        socialLink: formData.socialLink,
        bust: formData.bust,
        waist: formData.waist,
        hips: formData.hips,
        sendMeasurementsLater: formData.sendMeasurementsLater,
        photos: [], // TODO: Handle photo upload
        figureComments: formData.figureComments,
        metalType: formData.metalType,
        initials: formData.initials,
        country: formData.country,
        city: formData.city,
        postalCode: formData.postalCode,
        address: formData.address,
        deliveryMethod: formData.deliveryMethod,
        desiredDate: formData.desiredDate,
        needOnlineMeasurements: formData.needOnlineMeasurements,
      });
      
      // Показать сообщение об успехе
      alert('Заявка на индивидуальный заказ отправлена! Мы свяжемся с вами в ближайшее время.');
      navigate('/');
    } catch (error) {
      console.error('Error submitting custom order:', error);
      alert('Произошла ошибка при отправке заявки. Попробуйте еще раз.');
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очистить ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6 sm:mb-8">
      {/* Mobile Progress Bar */}
      <div className="block sm:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-luxury-950">
            Шаг {currentStep} из {STEPS.length}
          </span>
          <span className="text-sm text-luxury-600">
            {Math.round((currentStep / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-luxury-200 rounded-full h-2">
          <div 
            className="bg-primary-950 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Progress Bar */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                currentStep > step.id 
                  ? "bg-green-500 text-white" 
                  : currentStep === step.id 
                    ? "bg-primary-950 text-white" 
                    : "bg-luxury-200 text-luxury-600"
              )}>
                {currentStep > step.id ? <Check size={16} /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 transition-all duration-300",
                  currentStep > step.id ? "bg-green-500" : "bg-luxury-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-semibold text-luxury-950 mb-1">
          {STEPS[currentStep - 1].title}
        </h2>
        <p className="text-luxury-600 text-sm">
          {STEPS[currentStep - 1].description}
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Имя *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className={cn(
            "w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950 min-h-[44px]",
            errors.name ? "border-red-500" : "border-luxury-300"
          )}
          placeholder="Введите ваше имя"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className={cn(
            "w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950 min-h-[44px]",
            errors.email ? "border-red-500" : "border-luxury-300"
          )}
          placeholder="example@email.com"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Телефон *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          className={cn(
            "w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950 min-h-[44px]",
            errors.phone ? "border-red-500" : "border-luxury-300"
          )}
          placeholder="+7 (999) 123-45-67"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Предпочтительный способ связи
        </label>
        <div className="space-y-2">
          {[
            { value: 'phone', label: 'Телефон' },
            { value: 'messenger', label: 'Мессенджер' },
            { value: 'email', label: 'Email' }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value={option.value}
                checked={formData.preferredContact === option.value}
                onChange={(e) => updateFormData('preferredContact', e.target.value)}
                className="mr-3"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Ссылка на соцсети (опционально)
        </label>
        <input
          type="url"
          value={formData.socialLink}
          onChange={(e) => updateFormData('socialLink', e.target.value)}
          className="w-full px-4 py-3 border border-luxury-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950"
          placeholder="https://instagram.com/username"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={formData.sendMeasurementsLater}
            onChange={(e) => updateFormData('sendMeasurementsLater', e.target.checked)}
            className="mr-3"
          />
          Вышлю мерки после консультации с менеджером
        </label>
      </div>

      {!formData.sendMeasurementsLater && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-luxury-950 mb-2">
              Обхват груди (см) *
            </label>
            <input
              type="number"
              value={formData.bust}
              onChange={(e) => updateFormData('bust', e.target.value)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
                errors.bust ? "border-red-500" : "border-luxury-300"
              )}
              placeholder="90"
            />
            {errors.bust && <p className="text-red-500 text-sm mt-1">{errors.bust}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-950 mb-2">
              Талия (см) *
            </label>
            <input
              type="number"
              value={formData.waist}
              onChange={(e) => updateFormData('waist', e.target.value)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
                errors.waist ? "border-red-500" : "border-luxury-300"
              )}
              placeholder="70"
            />
            {errors.waist && <p className="text-red-500 text-sm mt-1">{errors.waist}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-950 mb-2">
              Бёдра (см) *
            </label>
            <input
              type="number"
              value={formData.hips}
              onChange={(e) => updateFormData('hips', e.target.value)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
                errors.hips ? "border-red-500" : "border-luxury-300"
              )}
              placeholder="95"
            />
            {errors.hips && <p className="text-red-500 text-sm mt-1">{errors.hips}</p>}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Фото для подгонки (опционально, до 5 фото)
        </label>
        <div className="border-2 border-dashed border-luxury-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Upload className="mx-auto mb-2 text-luxury-400" size={24} />
            <p className="text-luxury-600">Нажмите для загрузки фото</p>
            <p className="text-xs text-luxury-500 mt-1">JPG, PNG, WebP</p>
          </label>
        </div>
        
        {formData.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Фото ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Комментарии по особенностям фигуры
        </label>
        <textarea
          value={formData.figureComments}
          onChange={(e) => updateFormData('figureComments', e.target.value)}
          className="w-full px-4 py-3 text-base border border-luxury-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950 min-h-[88px]"
          rows={3}
          placeholder="Особенности фигуры, которые стоит учесть при пошиве"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Материал для инициалов
        </label>
        <div className="flex space-x-4">
          {[
            { value: 'gold', label: 'Золото' },
            { value: 'silver', label: 'Серебро' }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="metalType"
                value={option.value}
                checked={formData.metalType === option.value}
                onChange={(e) => updateFormData('metalType', e.target.value)}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Буквы или слово *
        </label>
        <input
          type="text"
          value={formData.initials}
          onChange={(e) => updateFormData('initials', e.target.value)}
          className={cn(
            "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
            errors.initials ? "border-red-500" : "border-luxury-300"
          )}
          placeholder="Например: AB или Anna"
          maxLength={20}
        />
        {errors.initials && <p className="text-red-500 text-sm mt-1">{errors.initials}</p>}
        <p className="text-xs text-luxury-500 mt-1">До 20 символов</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-luxury-950 mb-2">
            Страна *
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => updateFormData('country', e.target.value)}
            className={cn(
              "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
              errors.country ? "border-red-500" : "border-luxury-300"
            )}
            placeholder="Россия"
          />
          {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-luxury-950 mb-2">
            Город *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            className={cn(
              "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
              errors.city ? "border-red-500" : "border-luxury-300"
            )}
            placeholder="Москва"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Почтовый индекс
        </label>
        <input
          type="text"
          value={formData.postalCode}
          onChange={(e) => updateFormData('postalCode', e.target.value)}
          className="w-full px-4 py-3 border border-luxury-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950"
          placeholder="123456"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Адрес *
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          className={cn(
            "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950",
            errors.address ? "border-red-500" : "border-luxury-300"
          )}
          rows={3}
          placeholder="Улица, дом, квартира"
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Способ доставки
        </label>
        <div className="space-y-2">
          {[
            { value: 'courier', label: 'Курьер' },
            { value: 'europost', label: 'Европочта' },
            { value: 'cdek', label: 'СДЭК' }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="deliveryMethod"
                value={option.value}
                checked={formData.deliveryMethod === option.value}
                onChange={(e) => updateFormData('deliveryMethod', e.target.value)}
                className="mr-3"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-luxury-950 mb-2">
          Желаемый срок получения
        </label>
        <input
          type="date"
          value={formData.desiredDate}
          onChange={(e) => updateFormData('desiredDate', e.target.value)}
          className="w-full px-4 py-3 border border-luxury-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-950"
          min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Минимум через 30 дней
        />
        <p className="text-xs text-luxury-500 mt-1">Минимальный срок изготовления: 30 дней</p>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.needOnlineMeasurements}
            onChange={(e) => updateFormData('needOnlineMeasurements', e.target.checked)}
            className="mr-3"
          />
          Нужно снятие мерок онлайн
        </label>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="bg-luxury-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-luxury-950 mb-4">Проверьте ваши данные</h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <strong>Контакты:</strong><br />
            {formData.name} | {formData.email} | {formData.phone}
          </div>
          
          <div>
            <strong>Мерки:</strong><br />
            {formData.sendMeasurementsLater 
              ? 'Будут высланы после консультации'
              : `Грудь: ${formData.bust}см, Талия: ${formData.waist}см, Бёдра: ${formData.hips}см`
            }
          </div>
          
          <div>
            <strong>Инициалы:</strong><br />
            {formData.initials} ({formData.metalType === 'gold' ? 'Золото' : 'Серебро'})
          </div>
          
          <div>
            <strong>Доставка:</strong><br />
            {formData.country}, {formData.city}<br />
            {formData.address}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.dataProcessingConsent}
            onChange={(e) => updateFormData('dataProcessingConsent', e.target.checked)}
            className="mr-3 mt-1"
          />
          <span className="text-sm">
            Я согласен(на) на обработку персональных данных в соответствии с{' '}
            <a href="/privacy-policy" className="text-primary-950 underline">
              политикой конфиденциальности
            </a>
          </span>
        </label>
        {errors.dataProcessingConsent && (
          <p className="text-red-500 text-sm">{errors.dataProcessingConsent}</p>
        )}

        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.customOrderConsent}
            onChange={(e) => updateFormData('customOrderConsent', e.target.checked)}
            className="mr-3 mt-1"
          />
          <span className="text-sm">
            Я понимаю, что индивидуальный пошив не предусматривает стандартного возврата.
          </span>
        </label>
        {errors.customOrderConsent && (
          <p className="text-red-500 text-sm">{errors.customOrderConsent}</p>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white pt-16 sm:pt-20 md:pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-luxury-600 hover:text-primary-950 transition-colors duration-300 mb-4 sm:mb-6 min-h-[44px] px-2"
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-luxury-950 mb-2 leading-tight">
            Индивидуальный заказ
          </h1>
          <p className="text-luxury-600 text-sm sm:text-base">
            Создайте уникальное изделие по вашим параметрам
          </p>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-luxury-200 p-4 sm:p-6 md:p-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8 sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-luxury-200 py-4 px-4 sm:px-0 z-10">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={cn(
              "inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 flex-1 sm:flex-none",
              currentStep === 1
                ? "bg-luxury-200 text-luxury-400 cursor-not-allowed"
                : "bg-luxury-100 text-luxury-950 hover:bg-luxury-200"
            )}
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={nextStep}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-950 text-white rounded-lg font-medium hover:bg-primary-900 transition-all duration-300 flex-1 sm:flex-none"
            >
              <span>Далее</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-300 flex-1 sm:flex-none"
            >
              <Check size={16} />
              <span>Отправить заявку</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
