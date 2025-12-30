/**
 * Character Loader Service
 *
 * Loads character definitions from JSON and provides access to character data.
 */

import { CharacterDefinition, CharacterId } from '@two-rooms/shared';
import * as fs from 'fs';
import * as path from 'path';

export class CharacterLoader {
  private characters: Map<CharacterId, CharacterDefinition> = new Map();
  private loaded: boolean = false;

  /**
   * Load all character definitions from JSON file
   */
  async load(filePath?: string): Promise<void> {
    const dataPath =
      filePath || path.join(__dirname, '../../../data/characters.json');

    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (!data.characters || !Array.isArray(data.characters)) {
        throw new Error('Invalid characters.json format: missing characters array');
      }

      // Clear existing characters
      this.characters.clear();

      // Load each character
      for (const char of data.characters) {
        this.validateCharacter(char);
        this.characters.set(char.id, char as CharacterDefinition);
      }

      this.loaded = true;
      console.log(`Loaded ${this.characters.size} character definitions`);
    } catch (error) {
      console.error('Failed to load characters:', error);
      throw error;
    }
  }

  /**
   * Get a character definition by ID
   */
  getCharacter(id: CharacterId): CharacterDefinition | undefined {
    if (!this.loaded) {
      throw new Error('Characters not loaded. Call load() first.');
    }
    return this.characters.get(id);
  }

  /**
   * Get all character definitions
   */
  getAllCharacters(): CharacterDefinition[] {
    if (!this.loaded) {
      throw new Error('Characters not loaded. Call load() first.');
    }
    return Array.from(this.characters.values());
  }

  /**
   * Get characters by team
   */
  getCharactersByTeam(team: string): CharacterDefinition[] {
    return this.getAllCharacters().filter((char) => char.team === team);
  }

  /**
   * Get characters by complexity
   */
  getCharactersByComplexity(maxComplexity: number): CharacterDefinition[] {
    return this.getAllCharacters().filter(
      (char) => char.complexity <= maxComplexity
    );
  }

  /**
   * Check if a character exists
   */
  hasCharacter(id: CharacterId): boolean {
    return this.characters.has(id);
  }

  /**
   * Validate character definition
   */
  private validateCharacter(char: any): void {
    const required = ['id', 'name', 'team', 'class', 'description', 'complexity'];
    for (const field of required) {
      if (!(field in char)) {
        throw new Error(`Character missing required field: ${field}`);
      }
    }

    if (typeof char.id !== 'string' || char.id.length === 0) {
      throw new Error('Character id must be a non-empty string');
    }

    if (char.complexity < 1 || char.complexity > 5) {
      throw new Error('Character complexity must be between 1 and 5');
    }
  }
}

// Singleton instance
export const characterLoader = new CharacterLoader();
