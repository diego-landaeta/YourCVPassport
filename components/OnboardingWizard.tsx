import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { CheckCircleIcon, DocumentArrowUpIcon, EnvelopeIcon, LinkIcon, QrCodeIcon, ShareIcon, SparklesIcon, PencilIcon, CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useDropzone } from 'react-dropzone';
import { parseCV, ParsedCVData } from '../utils/cvParser';

interface OnboardingState {
    currentStep: number;
    goal: string | null;
    gender: 'male' | 'female' | null;
    cvFile: File | null;
    generatedSummary: string;
    generatedExperience: string[];
    setStep: (step: number) => void;
    setGoal: (goal: string) => void;
    setGender: (gender: 'male' | 'female') => void;
    setCvFile: (file: File | null) => void;
    reset: () => void;
    setGeneratedSummary: (summary: string) => void;
    setGeneratedExperience: (experience: string[]) => void;
    handle: string;
    setHandle: (handle: string) => void;
}

const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            currentStep: 0,
            goal: null,
            gender: null,
            cvFile: null,
            generatedSummary: '',
            generatedExperience: [],
            handle: '',
            setStep: (step) => set({ currentStep: step }),
            setGoal: (goal) => set({ goal }),
            setGender: (gender) => set({ gender }),
            setCvFile: (file) => set({ cvFile: file }),
            setGeneratedSummary: (summary) => set({ generatedSummary: summary }),
            setGeneratedExperience: (experience) => set({ generatedExperience: experience }),
            setHandle: (handle) => set({ handle }),
            reset: () => set({ currentStep: 0, goal: null, gender: null, cvFile: null, generatedSummary: '', generatedExperience: [], handle: '' }),
        }),
        {
            name: 'onboarding-progress', // unique name
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);

interface OnboardingWizardProps {
    onComplete: () => void;
    profile?: any;
    onSave?: (data: any) => Promise<void>;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, profile, onSave }) => {
    const t = useTranslations();
    const { currentStep, goal, gender, cvFile, generatedSummary, generatedExperience, handle, setStep, setGoal, setGender, setCvFile, setGeneratedSummary, setGeneratedExperience, setHandle, reset } = useOnboardingStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [copied, setCopied] = useState(false);


    const steps = t.onboardingWizard.steps;

    const totalSteps = steps.length;

    const handleNext = async () => {
        if (currentStep < totalSteps - 1) {
            setStep(currentStep + 1);
        } else {
            // Save data before completing
            if (onSave && generatedSummary) {
                try {
                    // Generate automatic handle if user didn't provide one
                    const finalHandle = handle || `user-${Date.now()}`;
                    
                    await onSave({
                        summary: generatedSummary,
                        experience: generatedExperience,
                        goal: goal,
                        handle: finalHandle,
                        gender: gender
                    });
                } catch (error) {}
            }
            reset(); // Reset state on completion
            onComplete();
        }
    };

    const handleBack = () => setStep(Math.max(currentStep - 1, 0));

    const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setCvFile(file);
            
            // Automatically start parsing when file is uploaded
            setIsGenerating(true);
            try {
                const parsedData = await parseCV(file);
                
                // Generate summary from parsed data
                const summary = parsedData.summary || 
                    `${parsedData.headline || 'Professional'} with experience in ${parsedData.skills?.slice(0, 3).join(', ') || 'various fields'}.`;
                
                // Generate experience highlights
                const experienceHighlights = parsedData.experiences?.slice(0, 3).map(exp => 
                    `${exp.title} at ${exp.company}: ${exp.description.substring(0, 100)}...`
                ) || [];
                
                setGeneratedSummary(summary);
                setGeneratedExperience(experienceHighlights);
                setIsGenerating(false);
            } catch (error) {setIsGenerating(false);
                // Continue without parsed data - user can fill manually
            }
        }
    }, [setCvFile, setGeneratedSummary, setGeneratedExperience]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
    } as any);



    const checkHandleAvailability = () => {
        if (!handle) return;
        setHandleStatus('checking');
        setTimeout(() => {
            if (handle === 'john-doe' || handle === 'admin') {
                setHandleStatus('taken');
            } else {
                setHandleStatus('available');
            }
        }, 1000);
    };

    const copyProfileUrl = () => {
        const url = `yourcvpassport.com/cv/${handle || 'your-name'}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Welcome
                return (
                    <div className="text-center animate-fade-in flex flex-col items-center gap-6">
                        <SparklesIcon className="w-24 h-24 text-cv-blue/30" />
                        <button onClick={handleNext} className="bg-cv-blue hover:bg-opacity-90 text-white font-bold py-3 px-12 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                            {t.onboardingWizard.startButton}
                        </button>
                    </div>
                );
            case 1: // Role & Goal + Gender
                return (
                    <div className="space-y-6 animate-fade-in w-full">
                        {/* Gender Selection - Required */}
                        <div>
                            <label className="block mb-3 font-semibold text-lg text-gray-800 dark:text-dark-text-primary">
                                Selecciona tu género <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <div
                                    onClick={() => setGender('male')}
                                    className={`flex-1 p-4 text-center rounded-lg border-2 cursor-pointer hover:border-cv-blue hover:bg-cv-blue/5 dark:hover:bg-cv-blue/10 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                                        gender === 'male'
                                        ? 'border-cv-blue bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue'
                                        : 'bg-gray-100 dark:bg-dark-bg-tertiary border-transparent text-gray-800 dark:text-dark-text-primary'
                                    }`}
                                >
                                    {gender === 'male' && <CheckCircleIcon className="w-5 h-5" />}
                                    <span>Masculino</span>
                                </div>
                                <div
                                    onClick={() => setGender('female')}
                                    className={`flex-1 p-4 text-center rounded-lg border-2 cursor-pointer hover:border-cv-blue hover:bg-cv-blue/5 dark:hover:bg-cv-blue/10 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                                        gender === 'female'
                                        ? 'border-cv-blue bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue'
                                        : 'bg-gray-100 dark:bg-dark-bg-tertiary border-transparent text-gray-800 dark:text-dark-text-primary'
                                    }`}
                                >
                                    {gender === 'female' && <CheckCircleIcon className="w-5 h-5" />}
                                    <span>Femenino</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Se usa para personalizar correctamente las traducciones de tu perfil
                            </p>
                        </div>

                        {/* Goal Selection */}
                        <div>
                            <label className="block mb-3 font-semibold text-lg text-gray-800 dark:text-dark-text-primary">
                                ¿Cuál es tu objetivo? <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-3">
                                {t.onboardingWizard.goals.map((goalOption) => (
                                    <div
                                        key={goalOption}
                                        onClick={() => setGoal(goalOption)}
                                        className={`p-4 text-center rounded-lg border-2 cursor-pointer hover:border-cv-blue hover:bg-cv-blue/5 dark:hover:bg-cv-blue/10 transition-all duration-200 flex items-center justify-center gap-3 font-semibold ${
                                            goal === goalOption
                                            ? 'border-cv-blue bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue'
                                            : 'bg-gray-100 dark:bg-dark-bg-tertiary border-transparent text-gray-800 dark:text-dark-text-primary'
                                        }`}
                                    >
                                        {goal === goalOption && <CheckCircleIcon className="w-5 h-5" />}
                                        <span>{goalOption}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2: // Import CV or Create with AI
                return (
                    <div className="animate-fade-in w-full space-y-6">
                        {/* Option 1: Upload CV */}
                        <div className="bg-gray-50 dark:bg-dark-bg-tertiary/30 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DocumentArrowUpIcon className="w-6 h-6 text-cv-blue" />
                                Opción 1: Subir tu CV existente
                            </h3>
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${isDragActive ? 'border-cv-blue bg-cv-blue/10' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary hover:border-cv-blue hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary/50'}`}>
                                <input {...getInputProps()} />
                                <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
                                <p className="mt-3 font-semibold text-center">
                                    {isDragActive ? t.onboardingWizard.dropHere : t.onboardingWizard.dragAndDrop}
                                </p>
                                <p className="text-sm text-gray-500 text-center my-2">{t.onboardingWizard.or}</p>
                                <div className="text-center">
                                    <button className="bg-cv-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-opacity-90 shadow-sm">
                                        {t.onboardingWizard.browseFiles}
                                    </button>
                                </div>
                            </div>
                            {cvFile && (
                                <p className="mt-3 font-semibold text-green-600 animate-fade-in flex items-center justify-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5" /> {cvFile.name}
                                </p>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-dark-bg-secondary text-gray-500 dark:text-gray-400 font-semibold">
                                    O
                                </span>
                            </div>
                        </div>

                        {/* Option 2: Create with AI */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <SparklesIcon className="w-6 h-6 text-cv-blue" />
                                Opción 2: Crear con IA (Recomendado)
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Nuestra IA te hará preguntas para crear tu CV profesional desde cero
                            </p>
                            <button 
                                onClick={() => {
                                    setCvFile(null); // Clear any uploaded file
                                    handleNext(); // Go to AI questionnaire
                                }}
                                className="w-full bg-gradient-to-r from-cv-blue to-purple-600 hover:from-cv-blue/90 hover:to-purple-600/90 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                Comenzar con IA
                            </button>
                        </div>
                    </div>
                );
            case 3: // AI Generation or Questionnaire
                // Show loading spinner while generating
                if (isGenerating) {
                    return (
                        <div className="animate-fade-in text-center">
                            <div className="flex justify-center items-center mb-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cv-blue"></div>
                            </div>
                            <p className="font-semibold text-lg">{t.onboardingWizard.aiGenerating}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {cvFile ? 'Analizando tu CV...' : 'Creando tu perfil profesional...'}
                            </p>
                        </div>
                    );
                }

                // Show generated content for review (if already generated)
                if (generatedSummary) {
                    return (
                        <div className="animate-fade-in text-left w-full space-y-6">
                            <div className="bg-gray-50 dark:bg-dark-bg-tertiary/30 p-6 rounded-xl border dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary mb-4 flex items-center gap-2">
                                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                    Revisa y edita tu perfil generado
                                </h3>
                                <div>
                                    <label className="block mb-2 font-semibold text-lg flex items-center gap-2">
                                        <PencilIcon className="w-5 h-5" /> Resumen Profesional
                                    </label>
                                    <textarea value={generatedSummary} onChange={(e) => setGeneratedSummary(e.target.value)} rows={4} className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all" />
                                </div>
                                <div className="mt-6">
                                    <label className="block mb-2 font-semibold text-lg flex items-center gap-2">
                                        <PencilIcon className="w-5 h-5" /> Logros Destacados
                                    </label>
                                    <textarea value={generatedExperience.join('\n')} onChange={(e) => setGeneratedExperience(e.target.value.split('\n'))} rows={5} className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    );
                }

                // Show AI questionnaire (if no CV and not generated yet)
                return (
                    <div className="animate-fade-in w-full space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3 mb-6">
                                <SparklesIcon className="w-8 h-8 text-cv-blue flex-shrink-0" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Cuéntame sobre ti
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Responde estas preguntas y la IA creará tu CV profesional
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Question 1: Professional Summary */}
                                <div>
                                    <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
                                        1. ¿Cuál es tu profesión y años de experiencia?
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Desarrollador Full Stack con 5 años de experiencia"
                                        className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all"
                                    />
                                </div>

                                {/* Question 2: Key Skills */}
                                <div>
                                    <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
                                        2. ¿Cuáles son tus principales habilidades?
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: React, Node.js, Python, Gestión de proyectos"
                                        className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all"
                                    />
                                </div>

                                {/* Question 3: Recent Experience */}
                                <div>
                                    <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
                                        3. ¿Cuál fue tu último trabajo o proyecto importante?
                                    </label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Ej: Desarrollé una plataforma de e-commerce que aumentó las ventas en un 40%"
                                        className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all"
                                    />
                                </div>

                                {/* Question 4: Education */}
                                <div>
                                    <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
                                        4. ¿Cuál es tu formación académica?
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Ingeniería en Sistemas - Universidad Nacional"
                                        className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all"
                                    />
                                </div>

                                {/* Question 5: Achievements */}
                                <div>
                                    <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
                                        5. ¿Cuál es tu mayor logro profesional?
                                    </label>
                                    <textarea 
                                        rows={2}
                                        placeholder="Ej: Lideré un equipo que redujo costos operativos en 30%"
                                        className="w-full p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    setIsGenerating(true);
                                    setTimeout(() => {
                                        setGeneratedSummary("Profesional experimentado con sólida trayectoria en desarrollo de soluciones innovadoras. Especializado en tecnologías modernas y metodologías ágiles, con un enfoque en resultados medibles y mejora continua.");
                                        setGeneratedExperience([
                                            "Lideré el desarrollo de proyectos clave que generaron impacto significativo en los resultados del negocio",
                                            "Implementé mejores prácticas y procesos que optimizaron la eficiencia del equipo",
                                            "Colaboré con equipos multidisciplinarios para entregar soluciones de alta calidad"
                                        ]);
                                        setIsGenerating(false);
                                    }, 3000);
                                }}
                                className="w-full mt-6 bg-gradient-to-r from-cv-blue to-purple-600 hover:from-cv-blue/90 hover:to-purple-600/90 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                Generar mi CV con IA
                            </button>
                        </div>
                    </div>
                );
            case 4: // Activate Stamps
                return (
                    <div className="animate-fade-in text-center">
                        <p className="mb-6">{t.onboardingWizard.stampsDescription}</p>
                        <div className="flex justify-center gap-4">
                            <button className="flex items-center gap-2 bg-cv-blue text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-opacity-90 transition-all">
                                <EnvelopeIcon className="w-5 h-5" />
                                {t.onboardingWizard.verifyEmail}
                            </button>
                        </div>
                    </div>
                );
            case 5: // Publish Profile
                return (
                    <div className="animate-fade-in w-full space-y-4">
                        <div>
                            <label className="block mb-2 font-semibold text-lg text-left text-gray-800 dark:text-dark-text-primary">{t.onboardingWizard.setHandle}</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Elige un nombre único para tu URL personalizada. Si lo dejas vacío, se generará uno automáticamente.
                            </p>
                            <div className="flex items-stretch">
                                <span className="bg-gray-100 dark:bg-dark-bg-tertiary p-3.5 rounded-l-lg border-y border-l border-gray-300 dark:border-gray-600 text-gray-500 text-sm">yourcvpassport.com/cv/</span>
                                <input type="text" value={handle} onChange={(e) => { setHandle(e.target.value); setHandleStatus('idle'); }} placeholder={t.onboardingWizard.handlePlaceholder} className="w-full p-3 bg-white dark:bg-dark-bg-secondary border-y border-r-0 border-gray-300 dark:border-gray-600 focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/50 outline-none transition-all" />
                                <button onClick={checkHandleAvailability} disabled={handleStatus === 'checking' || !handle} className="bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary font-semibold px-4 rounded-r-lg border-y border-r border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center w-32">
                                    {handleStatus === 'checking' && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                                    {handleStatus === 'idle' && t.urlSimulator.check}
                                    {handleStatus === 'available' && <CheckIcon className="w-5 h-5 text-green-600" />}
                                    {handleStatus === 'taken' && <XMarkIcon className="w-5 h-5 text-red-500" />}
                                </button>
                            </div>
                            <div className="h-6 mt-2 text-sm font-semibold">
                                {handleStatus === 'available' && <p className="text-green-600">{t.urlSimulator.available}</p>}
                                {handleStatus === 'taken' && <p className="text-red-500">{t.urlSimulator.taken}</p>}
                                {!handle && <p className="text-gray-500 dark:text-gray-400">Se generará un handle automático si continúas sin ingresar uno</p>}
                            </div>
                        </div>
                    </div>
                );
            case 6: // Share
                return (
                    <div className="animate-fade-in text-center">
                        <p className="mb-6 text-lg">{t.onboardingWizard.shareDescription}</p>
                        <div className="flex justify-center items-center gap-4">
                            <button onClick={copyProfileUrl} className={`flex items-center gap-2 p-3 rounded-lg transition-all ${copied ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                {copied ? <CheckCircleIcon className="w-6 h-6 text-green-600"/> : <LinkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>}
                                <span className={`font-semibold ${copied ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}`}>{copied ? t.onboardingWizard.copied : t.onboardingWizard.copyUrl}</span>
                            </button>
                        </div>
                        <div className="flex justify-center items-center gap-8 mt-8">
                            <div className="text-center"><QrCodeIcon className="w-10 h-10 mx-auto text-gray-500"/><p className="text-sm mt-1">QR</p></div>
                            <div className="text-center"><ShareIcon className="w-10 h-10 mx-auto text-gray-500"/><p className="text-sm mt-1">{t.onboardingWizard.social}</p></div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const isNextDisabled = () => {
        switch (currentStep) {
            case 1:
                return !goal || !gender; // Both gender and goal required
            case 2:
                // Allow to proceed either with CV or without (to use AI questionnaire)
                return false;
            case 3:
                return isGenerating || !generatedSummary;
            case 5:
                // Allow to proceed if handle is available OR if no handle is entered (will use default)
                return handle.length > 0 && handleStatus !== 'available';
            default:
                return false;
        }
    };

    return (
        <div className="bg-white dark:bg-dark-bg-secondary p-6 sm:p-10 rounded-2xl w-full max-w-3xl mx-auto border border-gray-200 dark:border-gray-700 shadow-2xl transition-all duration-300">
            <div className="mb-8">
                <p className="text-sm font-bold text-cv-blue">
                    {t.onboardingWizard.step.toUpperCase()} {currentStep + 1} {t.onboardingWizard.of.toUpperCase()} {totalSteps}
                </p>
                <div className="w-full bg-gray-200 dark:bg-dark-bg-tertiary rounded-full h-2 mt-2">
                    <div
                        className="bg-cv-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-dark-text-primary">{steps[currentStep].title}</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-8 text-lg">{steps[currentStep].description}</p>

            <div className="min-h-[250px] flex items-center justify-center py-8">
                {renderStepContent()}
            </div>

            <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleBack}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={currentStep === 0}
                >
                    &lt; {t.onboardingWizard.backButton}
                </button>
                <button
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    className="bg-cv-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {currentStep === totalSteps - 1 ? t.onboardingWizard.finishButton : t.onboardingWizard.nextButton}
                </button>
            </div>
        </div>
    );
};

export default OnboardingWizard;
