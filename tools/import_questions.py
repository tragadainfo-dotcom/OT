#!/usr/bin/env python3
"""Deterministic import. Requires Poppler (pdftotext); never infers answer keys.
Only whitespace and the explicit '(верно)' metadata are normalized.
"""
import hashlib
import json
import re
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1] / 'trainer'
HEADER = re.compile(r'ВОПРОС\s*№\s*(\d+)\s*-\s*(\d+)')
OPTION = re.compile(r'(?:^|\n)[ \t]*(\d+)\.[ \t]+(?=\S)')

def clean(text):
    return re.sub(r'\s+', ' ', text).strip()

def extract():
    questions, review, duplicates, files = [], [], [], []
    seen = {}
    for name, expected in [('1-2.pdf', 225), ('3.pdf', 454)]:
        path = ROOT / 'sources' / name
        pages = subprocess.check_output(['pdftotext','-raw',str(path),'-']).decode('utf-8').split('\f')
        if not pages[-1].strip(): pages.pop()
        text, page_offsets = '', []
        for page in pages:
            page_offsets.append(len(text))
            text += page + '\n'
        headers = list(HEADER.finditer(text))
        assert len(headers) == expected, (name, len(headers))
        files.append({'file': name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                      'pages': len(pages), 'records': len(headers)})
        assert [int(h[1]) for h in headers] == list(range(1, expected+1))
        for i, head in enumerate(headers):
            end = headers[i+1].start() if i+1 < len(headers) else len(text)
            block = text[head.end():end]
            # A new topic belongs to the next question, not the previous answer.
            block = block.split('ТЕМА:')[0]
            topics = re.findall(r'ТЕМА:\s*([^\n]+)', text[:head.start()])
            page = sum(offset <= head.start() for offset in page_offsets)
            source = {'file': name, 'number': int(head[1]), 'bankId': head[2], 'page': page}
            try:
                question = re.search(r'Вопрос:\s*(.*?)\s*Всего ответов:\s*(\d+)', block, re.S)
                assert question, 'Не выделен вопрос / число правильных ответов'
                answer_text = block.split('Все ответы:', 1)[1].strip()
                parts = list(OPTION.finditer(answer_text))
                assert len(parts) >= 2, 'Меньше двух вариантов'
                assert not answer_text[:parts[0].start()].strip(), 'Текст до первого варианта'
                assert [int(p[1]) for p in parts] == list(range(1, len(parts)+1)), 'Нарушена нумерация'
                options, correct = [], []
                for j, part in enumerate(parts):
                    value = answer_text[part.end():parts[j+1].start() if j+1<len(parts) else len(answer_text)]
                    marked = '(верно)' in value
                    assert value.count('(верно)') <= 1, 'Повторная отметка'
                    if marked:
                        assert value.lstrip().startswith('(верно)'), 'Неоднозначная отметка'
                        correct.append(str(j+1))
                    value = clean(value.replace('(верно)', ''))
                    assert value and 'Все ответы:' not in value and 'Ответ:' not in value, 'Повреждённый вариант'
                    options.append({'id': str(j+1), 'text': value})
                assert len(correct) == int(question[2]) and correct, 'Число отметок не совпадает с «Всего ответов»'
                # Cross-check the explicitly correct selected answers against the full answer list.
                selected = block[question.end():].split('Все ответы:',1)[0]
                selected = selected.split('Ответ:',1)[1].strip()
                selected_parts = list(OPTION.finditer(selected))
                for j, part in enumerate(selected_parts):
                    val = selected[part.end():selected_parts[j+1].start() if j+1<len(selected_parts) else len(selected)]
                    if '(верно)' in val:
                        assert part[1] in correct, 'Противоречие между выбранным ответом и ключом'
                        assert clean(val.replace('(верно)','')) == options[int(part[1])-1]['text'], 'Тексты правильного ответа различаются'
                q = {'id': 'q-'+head[2], 'text': clean(question[1]), 'options': options, 'correct': correct,
                     'topic': clean(topics[-1]) if topics else '', 'sources': [source]}
                fingerprint = (q['text'], tuple(o['text'] for o in options))
                if fingerprint in seen:
                    prev = seen[fingerprint]
                    assert prev['correct'] == correct, 'Конфликт ключей у дубликатов'
                    prev['sources'].append(source)
                    duplicates.append(source)
                else:
                    assert not any(x['id']==q['id'] for x in questions), 'ID банка повторён с другим текстом'
                    seen[fingerprint] = q
                    questions.append(q)
            except (AssertionError, IndexError) as exc:
                review.append({'source': source, 'reason': str(exc), 'raw': block})
    report = {'sourceRecords': sum(f['records'] for f in files), 'imported': len(questions),
              'duplicatesMerged': len(duplicates), 'multipleAnswerQuestions': sum(len(q['correct'])>1 for q in questions),
              'reviewCount': len(review), 'files': files, 'duplicates': duplicates, 'review': review}
    return questions, report

if __name__ == '__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args=parser.parse_args()
    questions, report = extract()
    outputs = {'questions.json': {'schemaVersion':1, 'version':'2026-11-18', 'questions':questions}, 'import-report.json': report}
    for name, value in outputs.items():
        data=json.dumps(value, ensure_ascii=False, indent=2)+'\n'
        if args.check:
            assert (ROOT/name).read_text() == data, name+' is stale'
        else:
            (ROOT/name).write_text(data)
    print(json.dumps({k:v for k,v in report.items() if k not in ('files','duplicates','review')},ensure_ascii=False))
