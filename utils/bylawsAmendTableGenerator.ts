import { saveAs } from 'file-saver'

// 定義與原本相同的介面
export interface ParsedRegulationData {
  titleFull: string
  titleShort: string
  bodyLines: string[]
}

const DEFAULT_AMEND_TEXT = [
  '請您在此撰寫修正總說明。',
  '',
  '依照〈中央行政機關法制作業應注意事項〉，修正法規的時候應當附上「總說明」。在序言中，彙總說明法規制（訂）定或修正的沿革、本次必須修正的理由；如果法規名稱有變更，也加以說明。接著，逐點簡要列明本次各修正的要點。最後，說明執行所需員額及經費的預估。'
]

function parseHtmlToBodyLines(html: string): string[] {
  const allLines: string[] = []
  if (!html) return allLines

  const pRegex = /<p class="([^"]+)">(.*?)<\/p>/g
  const stripHtmlTags = (str: string) => str.replace(/<[^>]+>/g, '')

  let currentArticleParts: string[] = []
  let pMatch

  while ((pMatch = pRegex.exec(html)) !== null) {
    // 【加上 || ''，旨在讓型別從 string | undefined 變成確實的 string
    const classList = pMatch[1] || ''
    let text = stripHtmlTags(pMatch[2] || '')

    if (
      classList.includes('law-chapter') ||
      classList.includes('law-art-num')
    ) {
      if (currentArticleParts.length > 0) {
        allLines.push(currentArticleParts.join('\n'))
      }
      currentArticleParts = [text]
    } else if (classList.includes('xiang')) {
      currentArticleParts.push('　' + text)
    } else if (classList.includes('kuan') || classList.includes('mu')) {
      currentArticleParts.push(text)
    }
  }

  if (currentArticleParts.length > 0) {
    allLines.push(currentArticleParts.join('\n'))
  }

  return allLines
}

function getRocDateString(): string {
  const date = new Date()
  const rocYear = date.getFullYear() - 1911
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${rocYear}${month}${day}`
}

function isChapter(text: string): boolean {
  return /^(第.+章)/.test(text.trim())
}

function createDocx(data: ParsedRegulationData, docxLib: any) {
  const {
    Document,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    VerticalAlign,
    BorderStyle,
    Header,
    Footer,
    PageNumber
  } = docxLib

  function createHeaderCell(text: string) {
    return new TableCell({
      children: [
        new Paragraph({
          text: text,
          alignment: AlignmentType.CENTER,
          style: 'tablePara'
        })
      ],
      verticalAlign: VerticalAlign.CENTER,
      shading: { fill: 'F2F2F2' }
    })
  }

  function createDataCell(
    text: string,
    styleId: string,
    isBold: boolean = false
  ) {
    const lines = text.split('\n')
    const paragraphs = lines.map((line: string, index: number) => {
      let lineIsBold = isBold
      if (!isBold && index === 0 && /^(第.+條)/.test(line.trim())) {
        lineIsBold = true
      }
      return new Paragraph({
        children: [new TextRun({ text: line, bold: lineIsBold })],
        style: styleId
      })
    })

    return new TableCell({
      children: paragraphs,
      verticalAlign: VerticalAlign.TOP
    })
  }

  function createEmptyCell(styleId: string) {
    return new TableCell({
      children: [new Paragraph({ text: '', style: styleId })],
      verticalAlign: VerticalAlign.TOP
    })
  }

  const margins = { top: 1417, right: 1417, bottom: 1417, left: 1417 }
  const defaultFont = {
    size: 22,
    font: { ascii: 'Times New Roman', eastAsia: '標楷體' }
  }
  const smallFont = {
    size: 18,
    font: { ascii: 'Times New Roman', eastAsia: '標楷體' }
  }

  const columnWidths = [3025, 3025, 3025]
  const tableStyle = 'tablePara'

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell('修正條文'),
      createHeaderCell('現行條文'),
      createHeaderCell('說明')
    ]
  })

  const contentRows: any[] = []
  contentRows.push(
    new TableRow({
      children: [
        createEmptyCell(tableStyle),
        createDataCell(data.titleFull, tableStyle, true),
        createEmptyCell(tableStyle)
      ]
    })
  )

  data.bodyLines.forEach((line) => {
    contentRows.push(
      new TableRow({
        children: [
          createEmptyCell(tableStyle),
          createDataCell(line, tableStyle, isChapter(line)),
          createEmptyCell(tableStyle)
        ]
      })
    )
  })

  const amendmentTable = new Table({
    rows: [headerRow, ...contentRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: columnWidths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'auto' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'auto' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'auto' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'auto' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'auto' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'auto' }
    }
  })

  return new Document({
    creator: 'NTPU學生議會法規系統',
    title: `${data.titleShort}修正提案附件`,
    styles: {
      default: { document: { run: defaultFont } },
      paragraphStyles: [
        {
          id: 'defaultStyle',
          name: 'Default',
          basedOn: 'Normal',
          next: 'Normal',
          run: defaultFont
        },
        {
          id: 'tablePara',
          name: 'Table',
          basedOn: 'Normal',
          next: 'Normal',
          run: defaultFont,
          paragraph: { spacing: { before: 0, after: 0 } }
        }
      ]
    },
    sections: [
      {
        properties: {
          page: { margin: margins, size: { width: 11909, height: 16834 } }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: `${data.titleShort}修正草案　第 `,
                    ...smallFont
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], ...smallFont }),
                  new TextRun({ text: ' 頁，共 ', ...smallFont }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    ...smallFont
                  }),
                  new TextRun({ text: ' 頁', ...smallFont })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], ...smallFont })
                ]
              })
            ]
          })
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `「${data.titleFull}」第某條修正草案`,
                bold: true,
                size: 32,
                color: '000000',
                font: { ascii: 'Times New Roman', eastAsia: '標楷體' }
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: '一、總說明',
                bold: true,
                size: 28,
                color: '000000',
                font: { ascii: 'Times New Roman', eastAsia: '標楷體' }
              })
            ]
          }),
          ...DEFAULT_AMEND_TEXT.map(
            (text) =>
              new Paragraph({
                text: text,
                style: 'defaultStyle',
                spacing: { after: text === '' ? 0 : 120 }
              })
          ),
          new Paragraph({
            spacing: { after: 120, before: 120 },
            children: [
              new TextRun({
                text: '二、條文對照表',
                bold: true,
                size: 28,
                color: '000000',
                font: { ascii: 'Times New Roman', eastAsia: '標楷體' }
              })
            ]
          }),
          amendmentTable
        ]
      }
    ]
  })
}

/**
 * 匯出並下載 Word 文件
 * @param rawRegulation 透過 API 獲取的原始法規資料
 */
export async function generateAndDownloadDocx(rawRegulation: any) {
  const parsedData: ParsedRegulationData = {
    titleFull: rawRegulation.titleFull,
    titleShort: rawRegulation.titleShort,
    bodyLines: parseHtmlToBodyLines(rawRegulation.fullText)
  }

  const docxLib = await import('docx')
  const { Packer } = docxLib

  const doc = createDocx(parsedData, docxLib)
  const blob = await Packer.toBlob(doc)

  const rocDate = getRocDateString()
  const filename = `${parsedData.titleShort || '法規'}修正案_${rocDate}.docx`

  saveAs(blob, filename)
}
