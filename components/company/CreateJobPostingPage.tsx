import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

interface JobFormData {
  title: string;
  department: string;
  employment_type: string;
  work_mode: string;
  experience_level: string;
  location_city: string;
  location_state: string;
  location_country: string;
  is_remote: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  required_skills: string[];
  optional_skills: string[];
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_period: string;
  show_salary: boolean;
  application_deadline: string;
  application_instructions: string;
}

const CreateJobPostingPage: React.FC = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: '',
    employment_type: 'FULL_TIME',
    work_mode: 'ONSITE',
    experience_level: 'MID',
    location_city: '',
    location_state: '',
    location_country: 'ES',
    is_remote: false,
    description: '',
    responsibilities: [''],
    requirements: [''],
    nice_to_have: [''],
    benefits: [''],
    required_skills: [],
    optional_skills: [],
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    salary_period: 'YEARLY',
    show_salary: false,
    application_deadline: '',
    application_instructions: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [optionalSkillInput, setOptionalSkillInput] = useState('');

  const t = {
    en: {
      titleCreate: 'Create Job Posting',
      titleEdit: 'Edit Job Posting',
      subtitle: 'Fill in the details to post your job vacancy',
      steps: {
        basic: 'Basic Info',
        description: 'Description',
        requirements: 'Requirements',
        compensation: 'Compensation',
      },
      fields: {
        title: 'Job Title',
        titlePlaceholder: 'e.g. Senior React Developer',
        department: 'Department',
        departmentPlaceholder: 'e.g. Engineering',
        employmentType: 'Employment Type',
        workMode: 'Work Mode',
        experienceLevel: 'Experience Level',
        location: 'Location',
        city: 'City',
        cityPlaceholder: 'e.g. Madrid',
        state: 'State/Province',
        statePlaceholder: 'e.g. Community of Madrid',
        country: 'Country',
        isRemote: 'Remote position',
        description: 'Job Description',
        descriptionPlaceholder: 'Describe the role, responsibilities, and what makes this opportunity unique...',
        responsibilities: 'Key Responsibilities',
        requirements: 'Requirements',
        niceToHave: 'Nice to Have',
        benefits: 'Benefits',
        requiredSkills: 'Required Skills',
        optionalSkills: 'Optional Skills',
        skillPlaceholder: 'Type a skill and press Enter',
        salaryRange: 'Salary Range',
        salaryMin: 'Minimum',
        salaryMax: 'Maximum',
        currency: 'Currency',
        period: 'Period',
        showSalary: 'Display salary publicly',
        deadline: 'Application Deadline',
        instructions: 'Application Instructions',
        instructionsPlaceholder: 'Additional instructions for candidates...',
      },
      employmentTypes: {
        FULL_TIME: 'Full Time',
        PART_TIME: 'Part Time',
        CONTRACT: 'Contract',
        TEMPORARY: 'Temporary',
        INTERNSHIP: 'Internship',
        FREELANCE: 'Freelance',
      },
      workModes: {
        REMOTE: 'Remote',
        ONSITE: 'On-site',
        HYBRID: 'Hybrid',
      },
      experienceLevels: {
        ENTRY: 'Entry Level',
        JUNIOR: 'Junior',
        MID: 'Mid-Level',
        SENIOR: 'Senior',
        LEAD: 'Lead',
        EXECUTIVE: 'Executive',
      },
      periods: {
        HOURLY: 'Per Hour',
        MONTHLY: 'Per Month',
        YEARLY: 'Per Year',
      },
      actions: {
        previous: 'Previous',
        next: 'Next',
        saveDraft: 'Save as Draft',
        publish: 'Publish',
        update: 'Update',
        cancel: 'Cancel',
        addItem: 'Add item',
        removeItem: 'Remove',
      },
      validation: {
        titleRequired: 'Job title is required',
        descriptionRequired: 'Job description is required',
        salaryInvalid: 'Maximum salary must be greater than minimum',
      },
      success: {
        created: 'Job posting created successfully!',
        updated: 'Job posting updated successfully!',
        published: 'Job posting published successfully!',
      },
    },
    es: {
      titleCreate: 'Crear Vacante',
      titleEdit: 'Editar Vacante',
      subtitle: 'Completa los detalles para publicar tu vacante',
      steps: {
        basic: 'Info Básica',
        description: 'Descripción',
        requirements: 'Requisitos',
        compensation: 'Compensación',
      },
      fields: {
        title: 'Título del Puesto',
        titlePlaceholder: 'ej. Desarrollador React Senior',
        department: 'Departamento',
        departmentPlaceholder: 'ej. Ingeniería',
        employmentType: 'Tipo de Empleo',
        workMode: 'Modalidad',
        experienceLevel: 'Nivel de Experiencia',
        location: 'Ubicación',
        city: 'Ciudad',
        cityPlaceholder: 'ej. Madrid',
        state: 'Estado/Provincia',
        statePlaceholder: 'ej. Comunidad de Madrid',
        country: 'País',
        isRemote: 'Posición remota',
        description: 'Descripción del Puesto',
        descriptionPlaceholder: 'Describe el rol, responsabilidades y qué hace única esta oportunidad...',
        responsibilities: 'Responsabilidades Clave',
        requirements: 'Requisitos',
        niceToHave: 'Deseable',
        benefits: 'Beneficios',
        requiredSkills: 'Habilidades Requeridas',
        optionalSkills: 'Habilidades Opcionales',
        skillPlaceholder: 'Escribe una habilidad y presiona Enter',
        salaryRange: 'Rango Salarial',
        salaryMin: 'Mínimo',
        salaryMax: 'Máximo',
        currency: 'Moneda',
        period: 'Período',
        showSalary: 'Mostrar salario públicamente',
        deadline: 'Fecha Límite',
        instructions: 'Instrucciones de Aplicación',
        instructionsPlaceholder: 'Instrucciones adicionales para candidatos...',
      },
      employmentTypes: {
        FULL_TIME: 'Tiempo Completo',
        PART_TIME: 'Medio Tiempo',
        CONTRACT: 'Contrato',
        TEMPORARY: 'Temporal',
        INTERNSHIP: 'Pasantía',
        FREELANCE: 'Freelance',
      },
      workModes: {
        REMOTE: 'Remoto',
        ONSITE: 'Presencial',
        HYBRID: 'Híbrido',
      },
      experienceLevels: {
        ENTRY: 'Nivel Inicial',
        JUNIOR: 'Junior',
        MID: 'Semi-Senior',
        SENIOR: 'Senior',
        LEAD: 'Líder',
        EXECUTIVE: 'Ejecutivo',
      },
      periods: {
        HOURLY: 'Por Hora',
        MONTHLY: 'Por Mes',
        YEARLY: 'Por Año',
      },
      actions: {
        previous: 'Anterior',
        next: 'Siguiente',
        saveDraft: 'Guardar Borrador',
        publish: 'Publicar',
        update: 'Actualizar',
        cancel: 'Cancelar',
        addItem: 'Agregar ítem',
        removeItem: 'Eliminar',
      },
      validation: {
        titleRequired: 'El título es requerido',
        descriptionRequired: 'La descripción es requerida',
        salaryInvalid: 'El salario máximo debe ser mayor al mínimo',
      },
      success: {
        created: '¡Vacante creada exitosamente!',
        updated: '¡Vacante actualizada exitosamente!',
        published: '¡Vacante publicada exitosamente!',
      },
    },
  };

  const translations = t[lang];

  useEffect(() => {
    fetchCompanyAndJobPosting();
  }, [id]);

  const fetchCompanyAndJobPosting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: companyUser, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (companyUserError || !companyUser) {
        toast.error(lang === 'en' ? 'No company found' : 'No se encontró empresa');
        navigate('/company/register');
        return;
      }

      setCompanyId(companyUser.company_id);

      if (isEditMode && id) {
        const { data: jobPosting, error: jobError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', id)
          .eq('company_id', companyUser.company_id)
          .single();

        if (jobError || !jobPosting) {
          toast.error(lang === 'en' ? 'Job posting not found' : 'Vacante no encontrada');
          navigate('/company/jobs');
          return;
        }

        setFormData({
          title: jobPosting.title || '',
          department: jobPosting.department || '',
          employment_type: jobPosting.employment_type || 'FULL_TIME',
          work_mode: jobPosting.work_mode || 'ONSITE',
          experience_level: jobPosting.experience_level || 'MID',
          location_city: jobPosting.location_city || '',
          location_state: jobPosting.location_state || '',
          location_country: jobPosting.location_country || 'ES',
          is_remote: jobPosting.is_remote || false,
          description: jobPosting.description || '',
          responsibilities: jobPosting.responsibilities || [''],
          requirements: jobPosting.requirements || [''],
          nice_to_have: jobPosting.nice_to_have || [''],
          benefits: jobPosting.benefits || [''],
          required_skills: jobPosting.required_skills || [],
          optional_skills: jobPosting.optional_skills || [],
          salary_min: jobPosting.salary_min?.toString() || '',
          salary_max: jobPosting.salary_max?.toString() || '',
          salary_currency: jobPosting.salary_currency || 'USD',
          salary_period: jobPosting.salary_period || 'YEARLY',
          show_salary: jobPosting.show_salary || false,
          application_deadline: jobPosting.application_deadline ? new Date(jobPosting.application_deadline).toISOString().split('T')[0] : '',
          application_instructions: jobPosting.application_instructions || '',
        });
      }
    } catch (error: any) {
      toast.error(lang === 'en' ? 'Error loading data' : 'Error al cargar datos');
    }
  };

  const handleArrayFieldChange = (field: keyof JobFormData, index: number, value: string) => {
    const updatedArray = [...(formData[field] as string[])];
    updatedArray[index] = value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const handleAddArrayField = (field: keyof JobFormData) => {
    setFormData({
      ...formData,
      [field]: [...(formData[field] as string[]), ''],
    });
  };

  const handleRemoveArrayField = (field: keyof JobFormData, index: number) => {
    const updatedArray = (formData[field] as string[]).filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updatedArray.length ? updatedArray : [''] });
  };

  const handleAddSkill = (type: 'required' | 'optional') => {
    const input = type === 'required' ? skillInput : optionalSkillInput;
    if (!input.trim()) return;

    const field = type === 'required' ? 'required_skills' : 'optional_skills';
    const currentSkills = formData[field] as string[];

    if (!currentSkills.includes(input.trim())) {
      setFormData({
        ...formData,
        [field]: [...currentSkills, input.trim()],
      });
    }

    if (type === 'required') {
      setSkillInput('');
    } else {
      setOptionalSkillInput('');
    }
  };

  const handleRemoveSkill = (type: 'required' | 'optional', skill: string) => {
    const field = type === 'required' ? 'required_skills' : 'optional_skills';
    setFormData({
      ...formData,
      [field]: (formData[field] as string[]).filter((s) => s !== skill),
    });
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.title.trim()) {
        toast.error(translations.validation.titleRequired);
        return false;
      }
    }
    if (step === 2) {
      if (!formData.description.trim()) {
        toast.error(translations.validation.descriptionRequired);
        return false;
      }
    }
    if (step === 4) {
      const min = parseFloat(formData.salary_min);
      const max = parseFloat(formData.salary_max);
      if (formData.salary_min && formData.salary_max && max < min) {
        toast.error(translations.validation.salaryInvalid);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSaveDraft = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const jobData = {
        company_id: companyId,
        created_by: user.id,
        title: formData.title,
        department: formData.department || null,
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        experience_level: formData.experience_level,
        location_city: formData.location_city || null,
        location_state: formData.location_state || null,
        location_country: formData.location_country,
        is_remote: formData.is_remote,
        description: formData.description,
        responsibilities: formData.responsibilities.filter((r) => r.trim()),
        requirements: formData.requirements.filter((r) => r.trim()),
        nice_to_have: formData.nice_to_have.filter((n) => n.trim()),
        benefits: formData.benefits.filter((b) => b.trim()),
        required_skills: formData.required_skills,
        optional_skills: formData.optional_skills,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        salary_period: formData.salary_period,
        show_salary: formData.show_salary,
        application_deadline: formData.application_deadline || null,
        application_instructions: formData.application_instructions || null,
        status: 'DRAFT',
      };

      if (isEditMode && id) {
        const { error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', id);

        if (error) throw error;
        toast.success(translations.success.updated);
      } else {
        const { error } = await supabase
          .from('job_postings')
          .insert([jobData]);

        if (error) throw error;
        toast.success(translations.success.created);
      }

      navigate('/company/jobs');
    } catch (error: any) {
      toast.error(error.message || (lang === 'en' ? 'Error saving job posting' : 'Error al guardar vacante'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {translations.steps.basic}
            </h3>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.title} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={translations.fields.titlePlaceholder}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.department}
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder={translations.fields.departmentPlaceholder}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>

            {/* Employment Type, Work Mode, Experience Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translations.fields.employmentType}
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                >
                  {Object.entries(translations.employmentTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translations.fields.workMode}
                </label>
                <select
                  value={formData.work_mode}
                  onChange={(e) => {
                    const newWorkMode = e.target.value;
                    setFormData({
                      ...formData,
                      work_mode: newWorkMode,
                      is_remote: newWorkMode === 'REMOTE'
                    });
                  }}
                  disabled={formData.is_remote}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(translations.workModes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translations.fields.experienceLevel}
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                >
                  {Object.entries(translations.experienceLevels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_remote}
                  onChange={(e) => {
                    const isRemote = e.target.checked;
                    setFormData({
                      ...formData,
                      is_remote: isRemote,
                      work_mode: isRemote ? 'REMOTE' : 'ONSITE'
                    });
                  }}
                  className="w-4 h-4 text-cv-blue rounded focus:ring-cv-blue"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.fields.isRemote}
                </span>
              </label>

              {!formData.is_remote && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {translations.fields.city}
                    </label>
                    <input
                      type="text"
                      value={formData.location_city}
                      onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                      placeholder={translations.fields.cityPlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {translations.fields.state}
                    </label>
                    <input
                      type="text"
                      value={formData.location_state}
                      onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                      placeholder={translations.fields.statePlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {translations.fields.country}
                    </label>
                    <input
                      type="text"
                      value={formData.location_country}
                      onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {translations.steps.description}
            </h3>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.description} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={translations.fields.descriptionPlaceholder}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.responsibilities}
              </label>
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => handleArrayFieldChange('responsibilities', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      onClick={() => handleRemoveArrayField('responsibilities', index)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      {translations.actions.removeItem}
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddArrayField('responsibilities')}
                className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                + {translations.actions.addItem}
              </button>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.benefits}
              </label>
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleArrayFieldChange('benefits', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                  />
                  {formData.benefits.length > 1 && (
                    <button
                      onClick={() => handleRemoveArrayField('benefits', index)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      {translations.actions.removeItem}
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddArrayField('benefits')}
                className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                + {translations.actions.addItem}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {translations.steps.requirements}
            </h3>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.requirements}
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      onClick={() => handleRemoveArrayField('requirements', index)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      {translations.actions.removeItem}
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddArrayField('requirements')}
                className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                + {translations.actions.addItem}
              </button>
            </div>

            {/* Nice to Have */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.niceToHave}
              </label>
              {formData.nice_to_have.map((nice, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={nice}
                    onChange={(e) => handleArrayFieldChange('nice_to_have', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                  />
                  {formData.nice_to_have.length > 1 && (
                    <button
                      onClick={() => handleRemoveArrayField('nice_to_have', index)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      {translations.actions.removeItem}
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddArrayField('nice_to_have')}
                className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                + {translations.actions.addItem}
              </button>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.requiredSkills}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('required'))}
                  placeholder={translations.fields.skillPlaceholder}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
                <button
                  onClick={() => handleAddSkill('required')}
                  className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill('required', skill)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Optional Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.optionalSkills}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={optionalSkillInput}
                  onChange={(e) => setOptionalSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('optional'))}
                  placeholder={translations.fields.skillPlaceholder}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
                <button
                  onClick={() => handleAddSkill('optional')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.optional_skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill('optional', skill)}
                      className="hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {translations.steps.compensation}
            </h3>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.salaryRange}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && parseFloat(value) > 10000000) {
                      toast.error(lang === 'en' ? 'Maximum salary is 10,000,000' : 'El salario máximo es 10,000,000');
                      return;
                    }
                    setFormData({ ...formData, salary_min: value });
                  }}
                  placeholder={translations.fields.salaryMin}
                  max="10000000"
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
                <input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && parseFloat(value) > 10000000) {
                      toast.error(lang === 'en' ? 'Maximum salary is 10,000,000' : 'El salario máximo es 10,000,000');
                      return;
                    }
                    setFormData({ ...formData, salary_max: value });
                  }}
                  placeholder={translations.fields.salaryMax}
                  max="10000000"
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
                <select
                  value={formData.salary_currency}
                  onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="MXN">MXN</option>
                </select>
                <select
                  value={formData.salary_period}
                  onChange={(e) => setFormData({ ...formData, salary_period: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                >
                  {Object.entries(translations.periods).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.show_salary}
                    onChange={(e) => setFormData({ ...formData, show_salary: e.target.checked })}
                    className="w-4 h-4 text-cv-blue rounded focus:ring-cv-blue"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {translations.fields.showSalary}
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'en'
                    ? 'Tip: Leave salary fields empty to show "To be negotiated" to candidates'
                    : 'Consejo: Deja los campos de salario vacíos para mostrar "A convenir" a los candidatos'}
                </p>
              </div>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.deadline}
              </label>
              <input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>

            {/* Application Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.fields.instructions}
              </label>
              <textarea
                value={formData.application_instructions}
                onChange={(e) => setFormData({ ...formData, application_instructions: e.target.value })}
                placeholder={translations.fields.instructionsPlaceholder}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? translations.titleEdit : translations.titleCreate}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {translations.subtitle}
              </p>
            </div>
            <button
              onClick={() => navigate('/company/jobs')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {translations.actions.cancel}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep
                        ? 'bg-cv-blue text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {translations.steps[Object.keys(translations.steps)[step - 1] as keyof typeof translations.steps]}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {translations.actions.previous}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : translations.actions.saveDraft}
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {translations.actions.next}
              </button>
            ) : (
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '...' : (isEditMode ? translations.actions.update : translations.actions.saveDraft)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPostingPage;
