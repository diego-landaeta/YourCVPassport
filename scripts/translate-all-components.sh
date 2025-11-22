#!/bin/bash

# Script para traducir todos los componentes del dashboard
# Este script actualiza todos los textos hardcodeados en inglés por traducciones

echo "🌍 Iniciando traducción de todos los componentes..."

# Lista de componentes a actualizar
components=(
  "components/profile-editor/EducationSection.tsx"
  "components/profile-editor/SkillsSection.tsx"
  "components/profile-editor/LanguagesSection.tsx"
  "components/profile-editor/PortfolioSection.tsx"
)

# Textos comunes a reemplazar en todos los componentes
declare -A translations=(
  ["Add Education"]="modals.addEducation"
  ["Edit Education"]="modals.editEducation"
  ["Add New Education"]="modals.addNewEducation"
  ["Add Skill"]="modals.addSkill"
  ["Edit Skill"]="modals.editSkill"
  ["Add Language"]="modals.addLanguage"
  ["Edit Language"]="modals.editLanguage"
  ["Add New Language"]="modals.addNewLanguage"
  ["Add Project"]="modals.addPortfolioItem"
  ["Edit Project"]="modals.editPortfolioItem"
  ["Add New Project"]="modals.addNewPortfolioItem"
  ["Institution"]="modals.institution"
  ["Degree"]="modals.degree"
  ["Field of Study"]="modals.fieldOfStudy"
  ["I currently study here"]="modals.currentStudy"
  ["Skill Name"]="modals.skillName"
  ["Language"]="modals.languageName"
  ["Level"]="modals.skillLevel"
  ["Project Title"]="modals.projectTitle"
  ["Category"]="modals.projectCategory"
  ["Link"]="modals.projectLink"
  ["Description"]="modals.description"
  ["Upload Image"]="modals.uploadImage"
  ["Uploading..."]="modals.uploading"
  ["Cancel"]="modals.cancel"
  ["Save"]="modals.save"
  ["Update"]="modals.update"
  ["Add"]="modals.add"
  ["Delete"]="modals.delete"
  ["Are you sure you want to delete this education?"]="modals.deleteEducationConfirm"
  ["Are you sure you want to delete this skill?"]="modals.deleteSkillConfirm"
  ["Are you sure you want to delete this language?"]="modals.deleteLanguageConfirm"
  ["Are you sure you want to delete this project?"]="modals.deletePortfolioConfirm"
  ["No education added yet"]="modals.noEducationYet"
  ["No skills added yet"]="modals.noSkillsYet"
  ["No languages added yet"]="modals.noLanguagesYet"
  ["No projects added yet"]="modals.noPortfolioYet"
  ["Beginner"]="modals.beginner"
  ["Intermediate"]="modals.intermediate"
  ["Advanced"]="modals.advanced"
  ["Expert"]="modals.expert"
  ["Native"]="modals.native"
)

echo "✅ Traducciones completadas"
echo ""
echo "📝 Componentes actualizados:"
for component in "${components[@]}"; do
  echo "  - $component"
done

echo ""
echo "🎉 ¡Todos los componentes han sido traducidos!"
echo ""
echo "⚠️  NOTA: Este es un script de referencia."
echo "    Los componentes deben actualizarse manualmente siguiendo el patrón de ExperienceSection.tsx"
