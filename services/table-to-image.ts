import { CanvasRenderingContext2D, createCanvas, TextMetrics, Fonts } from "jsr:@gfx/canvas@0.5.6";
import { Themes } from "../themes/index.ts";
import type { CSVData } from "../interfaces/csv_data.ts";
import type { ImageOptions } from "../interfaces/image_options.ts";
import type { TextDimension } from "../interfaces/text_dimension.ts";
import type { TableData } from "../interfaces/table_data.ts";

function measureText(context: CanvasRenderingContext2D, text: string, lineHeight: number): TextDimension {
    const lines = text.split("\n");
    let maxLineHeight: number = lineHeight;
    const textDimensions: TextDimension[] = lines.map((line: string): TextDimension => {
        const normalizedText: string = normalizeText(line);
        const normalizedTextMetrics: TextMetrics = context.measureText(normalizedText);
        const textMetrics: TextMetrics = context.measureText(line);

        const width = normalizedTextMetrics.width;
        let height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        if (height < lineHeight) {
            height = lineHeight;
        }
        if (maxLineHeight < height) {
            maxLineHeight = height;
        }
        return {
            width: width,
            height: height,
            lineHeight: height,
            lineCount: 1
        };
    });
    const maxWidth = Math.max(...textDimensions.map((dimension: TextDimension): number => dimension.width));
    const sumHeight = textDimensions.reduce((sum: number, dimension: TextDimension) => sum + dimension.height, 0);

    return {
        width: maxWidth,
        height: sumHeight,
        lineHeight: maxLineHeight,
        lineCount: lines.length
    };
}

function normalizeText(text: string): string {
    return text.replaceAll(/[ิีึืุูั่้๊๋็์]/g, "");
}

function CSVToTable(csvData: CSVData): TableData {
    let header: string[] = [];
    let data: string[][] = [];
    if (csvData.data.length === 0) {
        throw Error("empty csv data");
    }
    if (csvData.isFirstRowHeaders) {
        if (csvData.data.length === 1) {
            throw Error("empty csv data");
        }
        header = [...csvData.data[0]];
        data = [...csvData.data.slice(1)];
    } else {
        data = [...csvData.data];
    }
    return {
        header: header,
        data: data
    };
}

function TableToImage(tableData: TableData, imageOptions: ImageOptions): string {
    const { header, data } = tableData;

    if (data.length === 0) {
        return "No data";
    }
    if (header.length > 0 && data[0].length !== header.length) {
        return `The number of header and data do not match. Header has ${header.length} column(s), but data has ${data[0].length} column(s).`;
    }

    const theme = Themes[imageOptions.theme];

    // 1. Load font
    Fonts.register(theme.fontFile);

    const headerFont = `bold ${theme.headerFontSize}px bold ${theme.fontFamily}`;
    const bodyFont = `${theme.bodyFontSize}px ${theme.fontFamily}`;
    
    // 2. Create a temporary canvas element for precalculation
    const tempCanvasWidth = 4000;
    const tempCanvasHeight = 10000;
    const tempCanvas = createCanvas(tempCanvasWidth, tempCanvasHeight);
    const tempContext = tempCanvas.getContext('2d');
    
    // 3. Calculate table metrics
    const headerDimensions: TextDimension[] = header.map((headerText: string): TextDimension => {
        tempContext.font = headerFont; // Set font for measurement
        return measureText(tempContext, headerText, theme.headerLineHeight);
    })
    const dataDimensions: TextDimension[][] = data.map((row: string[]): TextDimension[] => {
        return row.map((cellText: string): TextDimension => {
            tempContext.font = bodyFont; // Set font for measurement
            return measureText(tempContext, cellText, theme.bodyLineHeight);
        });
    });

    // 4. Calculate column widths
    const colCount: number = data[0].length;
    const colWidths: number[] = [];
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
        let maxWidth = 0;
        for (const rowDimensions of dataDimensions) {
            maxWidth = Math.round(Math.max(maxWidth, rowDimensions[colIndex].width));
        }
        if (header.length > 0) {
            maxWidth = Math.round(Math.max(maxWidth, headerDimensions[colIndex].width));
        }
        colWidths.push(maxWidth + theme.cellHorizontalPadding * 2);
    }

    // 5. Calculate row heights
    const headerHeight: number = Math.round(Math.max(...headerDimensions.map((dimension: TextDimension): number => {
        return dimension.height;
    })) + theme.cellVerticalPadding * 2);
    const rowHeights: number[] = dataDimensions
        .map((rowDimensions: TextDimension[]): number => {
            return Math.round(Math.max(...rowDimensions.map((dimension: TextDimension): number => {
                return dimension.height;
            })) + theme.cellVerticalPadding * 2);
        });
  
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0) - (colCount - 1) * theme.borderWidth;
    const tableHeight = Math.round(rowHeights.reduce((sum, height) => sum + height, 0) + headerHeight) - (data.length * theme.borderWidth);

    // 6. Create actual canvas
    const canvas = createCanvas(tableWidth, tableHeight);
    const ctx = canvas.getContext('2d');

    // 7. Draw the table
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, tableWidth, tableHeight);

    // 8. Draw the header
    const borderHalfWidth = Math.round(theme.borderWidth / 2);
    let xOffset = 0;
    header.forEach((headerText: string, index: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = theme.headerBackgroundColor;
        ctx.fillRect(xOffset, 0, colWidths[index], headerHeight);
        ctx.lineWidth = theme.borderWidth;
        ctx.strokeStyle = theme.border;
        ctx.strokeRect(xOffset + borderHalfWidth, borderHalfWidth, colWidths[index] - theme.borderWidth, headerHeight - theme.borderWidth);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = theme.headerTextColor;

        const headerHorizontalCenter = Math.round(xOffset + colWidths[index] / 2);
        const headerVerticalCenter = Math.round(headerHeight / 2);
        ctx.font = headerFont;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(headerText, headerHorizontalCenter, headerVerticalCenter);
        ctx.restore();

        xOffset += (colWidths[index] - theme.borderWidth);
    });

    let yOffset = headerHeight - theme.borderWidth;
    data.forEach((row: string[], rowIndex: number) => {
        xOffset = 0;
        row.forEach((cellText: string, cellIndex: number) => {
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = theme.bodyBackgroundColor;
            ctx.fillRect(xOffset, yOffset, colWidths[cellIndex], rowHeights[rowIndex]);
            ctx.lineWidth = theme.borderWidth;
            ctx.strokeStyle = theme.border;
            ctx.strokeRect(xOffset + borderHalfWidth, yOffset + borderHalfWidth, colWidths[cellIndex] - theme.borderWidth, rowHeights[rowIndex] - theme.borderWidth);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = theme.bodyTextColor;

            const lines: string[] = cellText.split("\n");
            const dimension: TextDimension = dataDimensions[rowIndex][cellIndex];

            const cellHorizontalCenter = Math.round(xOffset + colWidths[cellIndex] / 2);
            const cellVerticalCenter = Math.round(yOffset + rowHeights[rowIndex] / 2);

            let subYOffset = cellVerticalCenter - dimension.height / 2;
            ctx.font = bodyFont;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            lines.forEach((line: string) => {
                ctx.fillText(line, cellHorizontalCenter, subYOffset + dimension.lineHeight / 2);
                subYOffset += dimension.lineHeight;
            });
            ctx.restore();

            xOffset += (colWidths[cellIndex] - theme.borderWidth);
        });
        yOffset += rowHeights[rowIndex] - theme.borderWidth;
    });

    // canvas.save("image.png");

    return canvas.toDataURL("png", 100);
}

export function CSVToTableImage(csvData: CSVData, imageOptions: ImageOptions): string {
    return TableToImage(CSVToTable(csvData), imageOptions);
}