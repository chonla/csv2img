import { Context } from 'jsr:@oak/oak';
import { parse, type ParseOptions } from "jsr:@std/csv";
import { CSVToTableImage } from '../services/table-to-image.ts';
import type { CreateRequest } from '../interfaces/create_request.ts';
import type { CSVData } from '../interfaces/csv_data.ts';
import type { ImageOptions } from '../interfaces/image_options.ts';

export async function getTable(ctx: Context) {
    const body = await ctx.request.body;
    const data = (await body.json()) as CreateRequest;
    const isFirstRowHeaders: boolean = data.csv.isFirstRowHeaders
    const csvRaw: string = data.csv.data;
    const theme = data.theme ? data.theme : "default";
    const width = data.width ? data.width : 800;

    const imageOptions: ImageOptions = {
        width: width,
        theme: theme
    }
    const csvOptions: ParseOptions = {
        skipFirstRow: false
    }
    
    const csvData: CSVData = {
        isFirstRowHeaders: isFirstRowHeaders,
        data: parse(csvRaw, csvOptions) as string[][]
    };
    const tableImageDataURL = CSVToTableImage(csvData, imageOptions);
    
    ctx.response.body = tableImageDataURL;
}