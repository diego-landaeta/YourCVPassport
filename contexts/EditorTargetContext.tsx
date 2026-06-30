import React, { createContext, useContext } from 'react';

// Contexto opcional que indica sobre QUÉ perfil opera el editor de CV.
//
// - Flujo normal (usuario editando su propio perfil): el provider NO está
//   presente, el hook devuelve null y cada sección sigue usando session.user.id
//   exactamente como antes (cero cambios de comportamiento).
// - Flujo gestor (profile_manager editando un perfil gestionado): el
//   ManagedProfileEditor envuelve el wizard con este provider, de modo que las
//   secciones que hacen lecturas/escrituras directas a Supabase apunten al
//   perfil gestionado en lugar de al perfil del gestor.
interface EditorTargetValue {
  profileId: string | null;
}

const EditorTargetContext = createContext<EditorTargetValue>({ profileId: null });

export const EditorTargetProvider: React.FC<{ profileId: string; children: React.ReactNode }> = ({
  profileId,
  children,
}) => (
  <EditorTargetContext.Provider value={{ profileId }}>{children}</EditorTargetContext.Provider>
);

// Devuelve el id del perfil objetivo del editor, o null si se edita el propio.
export const useEditorTargetId = (): string | null => useContext(EditorTargetContext).profileId;
