import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SearchAndReplaceOptions {
  searchResultClass: string;
}

export interface SearchAndReplaceStorage {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
  searchResults: Array<{ from: number; to: number }>;
  currentResultIndex: number;
}

const searchAndReplacePluginKey = new PluginKey('searchAndReplace');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      setReplaceTerm: (replaceTerm: string) => ReturnType;
      setCaseSensitive: (caseSensitive: boolean) => ReturnType;
      nextSearchResult: () => ReturnType;
      previousSearchResult: () => ReturnType;
      replace: () => ReturnType;
      replaceAll: () => ReturnType;
    };
  }
}

// Helper function to create decorations
function createDecorations(
  doc: any,
  searchTerm: string,
  caseSensitive: boolean,
  searchResultClass: string,
  storage: SearchAndReplaceStorage
): DecorationSet {
  const decorations: Decoration[] = [];
  const results: Array<{ from: number; to: number }> = [];

  if (!searchTerm || searchTerm.length === 0) {
    storage.searchResults = [];
    storage.currentResultIndex = -1;
    return DecorationSet.empty;
  }

  const searchFlags = caseSensitive ? 'g' : 'gi';
  let regex: RegExp;
  
  try {
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    regex = new RegExp(escapedTerm, searchFlags);
  } catch (e) {
    storage.searchResults = [];
    storage.currentResultIndex = -1;
    return DecorationSet.empty;
  }

  const text = doc.textContent;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    const from = match.index;
    const to = from + match[0].length;
    
    results.push({ from, to });
    
    const decoration = Decoration.inline(from, to, {
      class: searchResultClass,
    });
    
    decorations.push(decoration);
  }

  storage.searchResults = results;
  if (results.length > 0 && storage.currentResultIndex === -1) {
    storage.currentResultIndex = 0;
  } else if (results.length === 0) {
    storage.currentResultIndex = -1;
  }

  return DecorationSet.create(doc, decorations);
}

export const SearchAndReplace = Extension.create<SearchAndReplaceOptions, SearchAndReplaceStorage>({
  name: 'searchAndReplace',

  addOptions() {
    return {
      searchResultClass: 'search-result',
    };
  },

  addStorage() {
    return {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
      searchResults: [],
      currentResultIndex: -1,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            this.storage.searchTerm = searchTerm;
            tr.setMeta('searchAndReplace', { type: 'updateSearch' });
            dispatch(tr);
          }
          return true;
        },

      setReplaceTerm:
        (replaceTerm: string) =>
        () => {
          this.storage.replaceTerm = replaceTerm;
          return true;
        },

      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            this.storage.caseSensitive = caseSensitive;
            tr.setMeta('searchAndReplace', { type: 'updateSearch' });
            dispatch(tr);
          }
          return true;
        },

      nextSearchResult:
        () =>
        ({ editor, tr, dispatch }) => {
          const { searchResults, currentResultIndex } = this.storage;
          if (searchResults.length === 0) return false;

          const nextIndex = (currentResultIndex + 1) % searchResults.length;
          this.storage.currentResultIndex = nextIndex;

          const result = searchResults[nextIndex];
          if (result) {
            editor.commands.setTextSelection({ from: result.from, to: result.to });
            editor.commands.scrollIntoView();
          }

          if (dispatch) {
            tr.setMeta('searchAndReplace', { type: 'navigateResult', index: nextIndex });
            dispatch(tr);
          }
          return true;
        },

      previousSearchResult:
        () =>
        ({ editor, tr, dispatch }) => {
          const { searchResults, currentResultIndex } = this.storage;
          if (searchResults.length === 0) return false;

          const prevIndex = currentResultIndex <= 0 ? searchResults.length - 1 : currentResultIndex - 1;
          this.storage.currentResultIndex = prevIndex;

          const result = searchResults[prevIndex];
          if (result) {
            editor.commands.setTextSelection({ from: result.from, to: result.to });
            editor.commands.scrollIntoView();
          }

          if (dispatch) {
            tr.setMeta('searchAndReplace', { type: 'navigateResult', index: prevIndex });
            dispatch(tr);
          }
          return true;
        },

      replace:
        () =>
        ({ tr, dispatch }) => {
          const { searchResults, currentResultIndex, replaceTerm } = this.storage;
          if (searchResults.length === 0 || currentResultIndex === -1) return false;

          const currentResult = searchResults[currentResultIndex];
          if (!currentResult) return false;

          if (dispatch) {
            tr.insertText(replaceTerm, currentResult.from, currentResult.to);
            tr.setMeta('searchAndReplace', { type: 'replace' });
            dispatch(tr);
          }
          return true;
        },

      replaceAll:
        () =>
        ({ tr, dispatch }) => {
          const { searchResults, replaceTerm } = this.storage;
          if (searchResults.length === 0) return false;

          if (dispatch) {
            const sortedResults = [...searchResults].sort((a, b) => b.from - a.from);
            
            for (const result of sortedResults) {
              tr.insertText(replaceTerm, result.from, result.to);
            }
            
            tr.setMeta('searchAndReplace', { type: 'replaceAll' });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    const options = this.options;

    return [
      new Plugin({
        key: searchAndReplacePluginKey,
        state: {
          init: () => {
            return DecorationSet.empty;
          },
          apply: (tr, oldState) => {
            const meta = tr.getMeta('searchAndReplace');
            
            if (meta?.type === 'updateSearch' || meta?.type === 'replace' || meta?.type === 'replaceAll') {
              return createDecorations(
                tr.doc,
                storage.searchTerm,
                storage.caseSensitive,
                options.searchResultClass,
                storage
              );
            }

            if (meta?.type === 'navigateResult') {
              return createDecorations(
                tr.doc,
                storage.searchTerm,
                storage.caseSensitive,
                options.searchResultClass,
                storage
              );
            }

            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations: (state) => {
            return searchAndReplacePluginKey.getState(state);
          },
        },
      }),
    ];
  },
});