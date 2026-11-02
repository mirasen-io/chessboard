import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	{
		plugins: {
			'@typescript-eslint': tseslint.plugin
		}
	},
	includeIgnoreFile(gitignorePath),
	eslint.configs.recommended,
	tseslint.configs.recommended,
	prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	}
);
