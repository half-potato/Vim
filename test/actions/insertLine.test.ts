import * as assert from 'assert';
import { Position, window } from 'vscode';
import { getCurrentParagraphBeginning, getCurrentParagraphEnd } from '../../src/textobject/paragraph';
import { WordType } from '../../src/textobject/word';
import { TextEditor } from '../../src/textEditor';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from '../testUtils';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getAndUpdateModeHandler } from '../../extension';
import * as vscode from 'vscode';
import { Configuration } from '../testConfiguration';

suite('insertLineBefore', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    const configuration = new Configuration();
    configuration.tabstop = 4;
    configuration.expandtab = true;

    await setupWorkspace(configuration);
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suiteTeardown(cleanUpWorkspace);

  test('tabs are added to match previous line even if line above does not match', async () => {
    // Setup the test
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('i\na'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>ob\nc'.split(''));

    // This is the current state of the document
    //
    //    a
    //    b
    //    c
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '2', 'G', 'O', 'a']);
    const text = vscode.window.activeTextEditor?.document.getText().replace('\r', '').split('\n');
    assert.ok(text);
    assert.strictEqual(text[1], text[2]);
  });

  test('no extra whitespace added when insertLineBefore inserts correct amount', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('i\na'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>ob\nc'.split(''));

    // This is the current state of the document
    //
    //    a
    //    b
    //    c
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '3', 'G', 'O', 'b']);
    const text = vscode.window.activeTextEditor?.document.getText().replace('\r', '').split('\n');
    assert.ok(text);
    assert.strictEqual(text[2], text[3]);
  });

  test('works at the top of the document', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('ia'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('gg>>'.split(''));

    // This is the current state of the document
    //    a
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'O', 'a']);
    const text = vscode.window.activeTextEditor?.document.getText().replace('\r', '').split('\n');
    assert.ok(text);
    assert.strictEqual(text[0], text[1]);
  });

  test('works with multiple cursors', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('oa'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>'.split(''));
    // This is the current state of the document
    //
    //    a
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '2', 'G', '2', 'O', 'a']);
    // After
    //
    //    a
    //    a
    //    a
    const text = vscode.window.activeTextEditor?.document.getText().replace('\r', '').split('\n');
    assert.ok(text);
    assert.strictEqual(text[1], text[2]);
    assert.strictEqual(text[2], text[3]);
  });
});
