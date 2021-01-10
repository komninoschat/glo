import { Command, flags } from '@oclif/command';
import { readFileSync } from 'fs';
import interpret from '@glossa-glo/glo';
import interpretPseudo from '@glossa-glo/ps';
import GLOError from '@glossa-glo/error';
import chalk from 'chalk';
import cli from 'cli-ux';
import { basename } from 'path';
import readline from 'readline';

function formatError(sourceCode: string, fileName: string, error: GLOError) {
  const header =
    chalk.bold(
      fileName +
        (error.start.linePosition !== -1 && error.start.characterPosition !== -1
          ? `:${error.start.linePosition + 1}:${error.start.characterPosition}:`
          : ':') +
        ' ' +
        chalk.redBright('Σφάλμα:') +
        ' ' +
        error.message,
    ) + '\n\n';

  let codeLine = '';

  if (
    error.start.characterPosition === -1 ||
    error.start.linePosition === -1 ||
    error.end.characterPosition === -1 ||
    error.end.linePosition === -1
  ) {
    codeLine = '<Καμία πληροφορία τοποθεσίας δεν δόθηκε>';
  } else if (error.start.linePosition === error.end.linePosition) {
    codeLine =
      sourceCode.split('\n')[error.start.linePosition] +
      '\n' +
      ' '.repeat(error.start.characterPosition) +
      chalk.bold(
        chalk.blueBright(
          `^`.repeat(
            error.end.characterPosition - error.start.characterPosition,
          ),
        ),
      );
  } else {
    codeLine =
      sourceCode.split('\n')[error.start.linePosition - 1] +
      '\n' +
      ' '.repeat(error.start.characterPosition) +
      chalk.bold(chalk.blueBright(`^`));
  }

  return header + codeLine + '\n';
}

class Psi extends Command {
  static description = 'Διερμηνευτής της Γλώσσας';

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    pseudo: flags.boolean(),
  };

  static args = [
    {
      name: 'αρχείο',
      required: false,
      description: 'Μονοπάτι αρχείου πηγαίου κώδικα',
    },
  ];

  async run() {
    const { args, flags } = this.parse(Psi);

    let file: string = args['αρχείο'];

    if (!file) {
      file = await cli.prompt(
        'Παρακαλώ γράψε το μονοπάτι του αρχείου του πηγαίου κώδικα:',
      );
    }

    let sourceCode = '';
    try {
      sourceCode = readFileSync(file, 'utf8');
    } catch (error) {
      console.error(
        'Παρουσιάστικε σφάλμα όσο προσπαθούσα να διαβάσω το αρχείο πηγαίου κώδικα\nΠαρακαλώ σιγουρέψου πως έχεις δώσει το σωστό μονοπάτι\nΚωδικός σφάλματος: ' +
          error.code,
      );
      process.exit(1);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    try {
      await (flags.pseudo ? interpretPseudo : interpret)(sourceCode, {
        read: () => {
          return new Promise((resolve, reject) => {
            rl.question('', data => {
              resolve(data);
            });
          });
        },
        write: (...data: string[]) => Promise.resolve(console.log(...data)),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      console.error(formatError(sourceCode, basename(file), error));

      console.error('Η εκτέλεση του προγράμματος διακόπηκε με λάθη');

      process.exit(1);
    }
    rl.close();
  }
}

export = Psi;
