import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';

class ForecastRequestDto {
  @ApiProperty({ type: [Number], example: [2200, 2215, 2230, 2245, 2260, 2275, 2290, 2305, 2320, 2335] })
  historical_sales!: number[];

  @ApiProperty({ example: 90, required: false })
  horizon!: number;

  @ApiProperty({ example: 'additive', required: false })
  seasonality_mode!: string;


  @ApiProperty({ example: '2026-06-01', required: false })
  start_date!: string;
}

@ApiTags('Machine Learning')
@Controller('ml/forecast')
export class MlController {
  @Post('predict')
  @ApiOperation({ summary: 'Predict demand utilizing OLS Linear Regression' })
  @ApiResponse({ status: 200, description: 'Forecast returned successfully.' })
  @ApiBody({ type: ForecastRequestDto })
  async predictDemand(@Body() body: any) {
    if (!body || !Array.isArray(body.historical_sales)) {
      throw new HttpException('Missing or invalid historical_sales array', HttpStatus.BAD_REQUEST);
    }

    const rawUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const mlServiceUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

    try {
      const response = await fetch(`${mlServiceUrl}/api/v1/ml/forecast/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          historical_sales: body.historical_sales,
          horizon: body.horizon ?? 90,
          seasonality_mode: body.seasonality_mode ?? 'additive',
          start_date: body.start_date ?? '2026-06-01',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `ML Forecasting service responded with status ${response.status}: ${errorText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to communicate with ML Forecasting service: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
